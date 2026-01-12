import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import {
  ExtractRefresh,
  frequencyDetailsSchema,
  Schedule,
} from '../../sdks/tableau/types/extractRefreshTask.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  taskId: z.string(),
  type: z.enum(['FullRefresh', 'IncrementalRefresh']).optional(),
  workbookId: z.string().optional(),
  datasourceId: z.string().optional(),
  frequency: z.enum(['Hourly', 'Daily', 'Weekly', 'Monthly']).optional(),
  frequencyDetails: frequencyDetailsSchema.optional(),
};

export const getUpdateExtractRefreshTaskTool = (server: Server): Tool<typeof paramsSchema> => {
  const updateExtractRefreshTaskTool = new Tool({
    server,
    name: 'update-extract-refresh-task',
    description: `
  Updates an existing extract refresh task.

  **Important:** This operation is only available on Tableau Cloud (API 3.20+).

  **Parameters:**
  - taskId: The ID of the task to update (required)
  - type: Optional - change refresh type to "FullRefresh" or "IncrementalRefresh"
  - workbookId: Optional - change target workbook
  - datasourceId: Optional - change target datasource
  - frequency: Optional - change schedule frequency
  - frequencyDetails: Optional - change timing configuration

  **Example - Change frequency to daily at 3 AM:**
  {
    "taskId": "task123",
    "frequency": "Daily",
    "frequencyDetails": {
      "start": "03:00:00"
    }
  }

  **Example - Change refresh type:**
  {
    "taskId": "task123",
    "type": "FullRefresh"
  }
  `,
    paramsSchema,
    annotations: {
      title: 'Update Extract Refresh Task',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { taskId, type, workbookId, datasourceId, frequency, frequencyDetails },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();
      return await updateExtractRefreshTaskTool.logAndExecute({
        requestId,
        authInfo,
        args: { taskId, type, workbookId, datasourceId, frequency, frequencyDetails },
        callback: async () => {
          const result = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.extractRefreshMethods.updateExtractRefreshTask({
                siteId: restApi.siteId,
                taskId,
                type,
                workbookId,
                datasourceId,
                frequency,
                frequencyDetails,
              });
            },
          });

          return new Ok(result);
        },
        constrainSuccessResult: (result) => constrainUpdateResult({ result }),
      });
    },
  });

  return updateExtractRefreshTaskTool;
};

function constrainUpdateResult({
  result,
}: {
  result: { extractRefresh: ExtractRefresh; schedule?: Schedule };
}): ConstrainedResult<{ extractRefresh: ExtractRefresh; schedule?: Schedule }> {
  return {
    type: 'success',
    result,
  };
}
