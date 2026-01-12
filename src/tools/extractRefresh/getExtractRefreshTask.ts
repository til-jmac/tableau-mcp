import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { ExtractRefresh } from '../../sdks/tableau/types/extractRefreshTask.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  taskId: z.string(),
};

export const getGetExtractRefreshTaskTool = (server: Server): Tool<typeof paramsSchema> => {
  const getExtractRefreshTaskTool = new Tool({
    server,
    name: 'get-extract-refresh-task',
    description: `
  Retrieves details for a specific extract refresh task by its ID.

  Use this tool when a user wants to:
  - Get detailed information about a specific extract refresh task
  - Check the schedule and configuration of a task
  - View the consecutive failure count for troubleshooting

  Returns the task details including:
  - Task ID, type, and priority
  - Associated workbook or datasource
  - Schedule frequency and timing details
  - Next scheduled run time
  - Consecutive failure count
  `,
    paramsSchema,
    annotations: {
      title: 'Get Extract Refresh Task',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ taskId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();
      return await getExtractRefreshTaskTool.logAndExecute({
        requestId,
        authInfo,
        args: { taskId },
        callback: async () => {
          const task = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.extractRefreshMethods.getExtractRefreshTask({
                siteId: restApi.siteId,
                taskId,
              });
            },
          });

          return new Ok(task);
        },
        constrainSuccessResult: (task) => constrainExtractRefreshTask({ task }),
      });
    },
  });

  return getExtractRefreshTaskTool;
};

function constrainExtractRefreshTask({
  task,
}: {
  task: ExtractRefresh;
}): ConstrainedResult<ExtractRefresh> {
  return {
    type: 'success',
    result: task,
  };
}
