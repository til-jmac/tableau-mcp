import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import AdmZip from 'adm-zip';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { Server } from '../../server.js';
import {
  categorizeFile,
  ensureExtractionsDir,
  FileCategory,
  fileExists,
  formatFileSize,
  getExtractionPath,
} from '../../utils/fileSystem.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  filePath: z.string().describe('Full path to the .twbx file to unpack (from download-workbook)'),
  extractTo: z
    .string()
    .optional()
    .describe('Optional extraction directory. Defaults to a temp subdirectory based on filename.'),
};

export type UnpackTwbxError = {
  type: 'file-not-found' | 'invalid-file-type' | 'extraction-failed' | 'unsafe-path';
  message: string;
};

interface FileInfo {
  path: string;
  size: number;
  sizeFormatted: string;
  category: FileCategory;
}

interface UnpackResult {
  extractionPath: string;
  mainTwbFile: string | null;
  mainTwbPath: string | null;
  summary: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    twbCount: number;
    dataCount: number;
    imageCount: number;
    otherCount: number;
  };
  categories: {
    twbFiles: string[];
    dataFiles: string[];
    imageFiles: string[];
    otherFiles: string[];
  };
  fileInventory: FileInfo[];
}

/**
 * Validate that a path is safe and within the target directory (Zip Slip protection)
 */
function isPathSafe(targetDir: string, entryPath: string): boolean {
  const resolvedPath = path.resolve(targetDir, entryPath);
  const resolvedTarget = path.resolve(targetDir);
  return resolvedPath.startsWith(resolvedTarget + path.sep) || resolvedPath === resolvedTarget;
}

export const getUnpackTwbxTool = (server: Server): Tool<typeof paramsSchema> => {
  const unpackTwbxTool = new Tool({
    server,
    name: 'unpack-twbx',
    description:
      'Extracts and analyzes the contents of a Tableau .twbx file. ' +
      'A .twbx is a packaged workbook containing the workbook XML (.twb), data extracts, and images. ' +
      'Returns the extraction path and a categorized inventory of all files. ' +
      'Use with files downloaded via download-workbook tool.',
    paramsSchema,
    annotations: {
      title: 'Unpack TWBX',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async ({ filePath, extractTo }, { requestId }): Promise<CallToolResult> => {
      return await unpackTwbxTool.logAndExecute<UnpackResult, UnpackTwbxError>({
        requestId,
        authInfo: null,
        args: { filePath, extractTo },
        callback: async () => {
          // Validate file exists
          const exists = await fileExists(filePath);
          if (!exists) {
            return new Err({
              type: 'file-not-found',
              message: `File not found: ${filePath}. Use download-workbook to download a workbook first.`,
            });
          }

          // Validate file extension
          const ext = path.extname(filePath).toLowerCase();
          if (ext !== '.twbx') {
            return new Err({
              type: 'invalid-file-type',
              message: `Invalid file type: expected .twbx, got ${ext || '(no extension)'}`,
            });
          }

          // Determine extraction directory
          const baseName = path.basename(filePath, '.twbx');
          await ensureExtractionsDir();
          const extractionPath = extractTo || getExtractionPath(baseName);

          // Read and parse ZIP
          let zip: AdmZip;
          try {
            zip = new AdmZip(filePath);
          } catch (error) {
            return new Err({
              type: 'extraction-failed',
              message: `Failed to read TWBX file: ${error instanceof Error ? error.message : String(error)}`,
            });
          }

          // Build file inventory and extract safely (Zip Slip protection)
          const entries = zip.getEntries();
          const fileInventory: FileInfo[] = [];
          const categories = {
            twbFiles: [] as string[],
            dataFiles: [] as string[],
            imageFiles: [] as string[],
            otherFiles: [] as string[],
          };

          let totalSize = 0;
          let mainTwbFile: string | null = null;

          try {
            // Ensure extraction directory exists
            await fs.mkdir(extractionPath, { recursive: true });

            for (const entry of entries) {
              if (entry.isDirectory) continue;

              const entryPath = entry.entryName;

              // Zip Slip protection: validate path is within target directory
              if (!isPathSafe(extractionPath, entryPath)) {
                return new Err({
                  type: 'unsafe-path',
                  message: `Unsafe path detected in archive: ${entryPath}`,
                });
              }

              const category = categorizeFile(entryPath);
              const size = entry.header.size;

              totalSize += size;

              fileInventory.push({
                path: entryPath,
                size,
                sizeFormatted: formatFileSize(size),
                category,
              });

              // Categorize for summary
              switch (category) {
                case 'twb':
                  categories.twbFiles.push(entryPath);
                  // Main TWB is typically at root level (shortest path)
                  if (!mainTwbFile || entryPath.split('/').length < mainTwbFile.split('/').length) {
                    mainTwbFile = entryPath;
                  }
                  break;
                case 'data':
                  categories.dataFiles.push(entryPath);
                  break;
                case 'image':
                  categories.imageFiles.push(entryPath);
                  break;
                default:
                  categories.otherFiles.push(entryPath);
              }

              // Extract file safely
              const targetPath = path.join(extractionPath, entryPath);
              const targetDir = path.dirname(targetPath);
              await fs.mkdir(targetDir, { recursive: true });
              await fs.writeFile(targetPath, entry.getData());
            }
          } catch (error) {
            if ((error as UnpackTwbxError).type === 'unsafe-path') {
              throw error;
            }
            return new Err({
              type: 'extraction-failed',
              message: `Failed to extract TWBX file: ${error instanceof Error ? error.message : String(error)}`,
            });
          }

          return new Ok({
            extractionPath,
            mainTwbFile,
            mainTwbPath: mainTwbFile ? path.join(extractionPath, mainTwbFile) : null,
            summary: {
              totalFiles: fileInventory.length,
              totalSize,
              totalSizeFormatted: formatFileSize(totalSize),
              twbCount: categories.twbFiles.length,
              dataCount: categories.dataFiles.length,
              imageCount: categories.imageFiles.length,
              otherCount: categories.otherFiles.length,
            },
            categories,
            fileInventory,
          });
        },
        constrainSuccessResult: (result) => ({
          type: 'success',
          result,
        }),
        getErrorText: (error) => error.message,
      });
    },
  });

  return unpackTwbxTool;
};
