import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  taskId: z.string(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this extract refresh task',
  }),
};

export type DeleteExtractRefreshTaskError = {
  type: 'confirmation-required';
  message: string;
};

export const getDeleteExtractRefreshTaskTool = (server: Server): Tool<typeof paramsSchema> => {
  const deleteExtractRefreshTaskTool = new Tool({
    server,
    name: 'delete-extract-refresh-task',
    description: `
  Deletes an extract refresh task permanently.

  **WARNING:** This is a destructive operation that cannot be undone.
  - The task will be permanently deleted
  - Any scheduled refreshes for this task will be cancelled
  - The associated workbook or datasource will no longer be refreshed on this schedule

  **Parameters:**
  - taskId: The ID of the extract refresh task to delete (required)
  - confirm: Must be set to true to confirm deletion (required)

  **Example:**
  {
    "taskId": "task123",
    "confirm": true
  }

  If you need to temporarily stop a task, consider updating its schedule instead of deleting it.
  `,
    paramsSchema,
    annotations: {
      title: 'Delete Extract Refresh Task',
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: false,
    },
    callback: async ({ taskId, confirm }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();
      return await deleteExtractRefreshTaskTool.logAndExecute<
        { deleted: boolean; taskId: string },
        DeleteExtractRefreshTaskError
      >({
        requestId,
        authInfo,
        args: { taskId, confirm },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message:
                'Deletion not confirmed. Set confirm=true to delete the extract refresh task. This action cannot be undone.',
            });
          }

          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:delete'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              await restApi.extractRefreshMethods.deleteExtractRefreshTask({
                siteId: restApi.siteId,
                taskId,
              });
            },
          });

          return new Ok({ deleted: true, taskId });
        },
        constrainSuccessResult: (result) => constrainDeleteResult({ result }),
      });
    },
  });

  return deleteExtractRefreshTaskTool;
};

function constrainDeleteResult({
  result,
}: {
  result: { deleted: boolean; taskId: string };
}): ConstrainedResult<{ deleted: boolean; taskId: string }> {
  return {
    type: 'success',
    result,
  };
}
