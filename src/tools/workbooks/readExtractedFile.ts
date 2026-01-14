import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { Server } from '../../server.js';
import { fileExists, formatFileSize, TEMP_BASE } from '../../utils/fileSystem.js';
import { Tool } from '../tool.js';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const paramsSchema = {
  filePath: z
    .string()
    .describe('Absolute path to the file to read. Must be within the tableau-mcp temp directory.'),
  maxSizeBytes: z
    .number()
    .optional()
    .describe('Maximum file size in bytes. Default 10485760 (10MB). Returns error if exceeded.'),
};

export type ReadExtractedFileError = {
  type: 'file-not-found' | 'access-denied' | 'file-too-large' | 'read-failed';
  message: string;
};

interface ReadFileResult {
  filePath: string;
  fileName: string;
  size: number;
  sizeFormatted: string;
  content: string;
  truncated: boolean;
}

/**
 * Validate that a path is safe and within the allowed directory
 */
function isPathAllowed(filePath: string): boolean {
  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return false;
  }

  // Resolve to absolute path and check it's within TEMP_BASE
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(TEMP_BASE);

  return resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase;
}

export const getReadExtractedFileTool = (server: Server): Tool<typeof paramsSchema> => {
  const readExtractedFileTool = new Tool({
    server,
    name: 'read-extracted-file',
    description:
      'Reads the contents of a file from the MCP server filesystem. ' +
      'Typically used after unpack-twbx to read TWB XML files or other extracted content. ' +
      'Only allows reading files within the tableau-mcp temp directory. ' +
      'For text-based files only (XML, CSV, JSON, etc.).',
    paramsSchema,
    annotations: {
      title: 'Read Extracted File',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ filePath, maxSizeBytes }, { requestId }): Promise<CallToolResult> => {
      const maxSize = maxSizeBytes ?? DEFAULT_MAX_SIZE;

      return await readExtractedFileTool.logAndExecute<ReadFileResult, ReadExtractedFileError>({
        requestId,
        authInfo: null,
        args: { filePath, maxSizeBytes: maxSize },
        callback: async () => {
          // Security: Validate path is within allowed directory
          if (!isPathAllowed(filePath)) {
            return new Err({
              type: 'access-denied',
              message: `Access denied: Path must be within ${TEMP_BASE} and cannot contain '..'`,
            });
          }

          const resolvedPath = path.resolve(filePath);

          // Check file exists
          const exists = await fileExists(resolvedPath);
          if (!exists) {
            return new Err({
              type: 'file-not-found',
              message: `File not found: ${resolvedPath}`,
            });
          }

          // Get file stats
          let stats;
          try {
            stats = await fs.stat(resolvedPath);
          } catch (error) {
            return new Err({
              type: 'read-failed',
              message: `Failed to read file stats: ${error instanceof Error ? error.message : String(error)}`,
            });
          }

          if (!stats.isFile()) {
            return new Err({
              type: 'read-failed',
              message: 'Path is not a file',
            });
          }

          // Check size limit
          if (stats.size > maxSize) {
            return new Err({
              type: 'file-too-large',
              message: `File size (${formatFileSize(stats.size)}) exceeds limit (${formatFileSize(maxSize)})`,
            });
          }

          // Read file content
          let content: string;
          try {
            content = await fs.readFile(resolvedPath, 'utf-8');
          } catch (error) {
            return new Err({
              type: 'read-failed',
              message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
            });
          }

          return new Ok({
            filePath: resolvedPath,
            fileName: path.basename(resolvedPath),
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            content,
            truncated: false,
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

  return readExtractedFileTool;
};
