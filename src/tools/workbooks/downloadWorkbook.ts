import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { ensureDownloadsDir, formatFileSize, getDownloadPath } from '../../utils/fileSystem.js';
import { resourceAccessChecker } from '../resourceAccessChecker.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  workbookId: z.string().describe('The LUID of the workbook to download'),
  includeExtract: z
    .boolean()
    .optional()
    .describe('Whether to include data extracts in the download. Default is true.'),
};

export type DownloadWorkbookError = {
  type: 'workbook-not-allowed' | 'download-failed';
  message: string;
};

interface DownloadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  format: 'twb' | 'twbx';
  nextStep: string;
}

export const getDownloadWorkbookTool = (server: Server): Tool<typeof paramsSchema> => {
  const downloadWorkbookTool = new Tool({
    server,
    name: 'download-workbook',
    description:
      'Downloads a Tableau workbook file (.twb or .twbx) to disk. Returns the file path where the workbook is saved. ' +
      'Use the unpack-twbx tool to extract and analyze the contents of .twbx files.',
    paramsSchema,
    annotations: {
      title: 'Download Workbook',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { workbookId, includeExtract },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await downloadWorkbookTool.logAndExecute<DownloadResult, DownloadWorkbookError>({
        requestId,
        authInfo,
        args: { workbookId, includeExtract },
        callback: async () => {
          const isWorkbookAllowedResult = await resourceAccessChecker.isWorkbookAllowed({
            workbookId,
            restApiArgs: { config, requestId, server, signal },
          });

          if (!isWorkbookAllowedResult.allowed) {
            return new Err({
              type: 'workbook-not-allowed',
              message: isWorkbookAllowedResult.message,
            });
          }

          return new Ok(
            await useRestApi({
              config,
              requestId,
              server,
              jwtScopes: ['tableau:workbooks:download'],
              signal,
              authInfo: getTableauAuthInfo(authInfo),
              callback: async (restApi) => {
                // Get workbook info for filename
                const workbook =
                  isWorkbookAllowedResult.content ??
                  (await restApi.workbooksMethods.getWorkbook({
                    workbookId,
                    siteId: restApi.siteId,
                  }));

                // Download the workbook content
                const response = await restApi.workbooksMethods.downloadWorkbookContent({
                  workbookId,
                  siteId: restApi.siteId,
                  includeExtract,
                });

                const buffer = Buffer.from(response.data);

                // Determine format from magic bytes (PK = ZIP = twbx)
                const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
                const format = isZip ? 'twbx' : 'twb';

                // Generate filename
                const safeName = workbook.name.replace(/[^a-zA-Z0-9_-]/g, '_');
                const fileName = `${safeName}.${format}`;

                // Ensure downloads directory exists and save file
                await ensureDownloadsDir();
                const filePath = getDownloadPath(fileName);
                await fs.writeFile(filePath, buffer);

                return {
                  filePath,
                  fileName,
                  fileSize: buffer.length,
                  fileSizeFormatted: formatFileSize(buffer.length),
                  format,
                  nextStep:
                    format === 'twbx'
                      ? 'Use the unpack-twbx tool with this filePath to extract and analyze the contents'
                      : 'The .twb file is XML and can be read directly',
                };
              },
            }),
          );
        },
        constrainSuccessResult: (result) => ({
          type: 'success',
          result,
        }),
        getErrorText: (error) => error.message,
      });
    },
  });

  return downloadWorkbookTool;
};
