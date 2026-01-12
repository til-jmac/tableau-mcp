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
  type: z.enum(['FullRefresh', 'IncrementalRefresh']),
  workbookId: z.string().optional(),
  datasourceId: z.string().optional(),
  frequency: z.enum(['Hourly', 'Daily', 'Weekly', 'Monthly']),
  frequencyDetails: frequencyDetailsSchema.optional(),
};

export const getCreateExtractRefreshTaskTool = (server: Server): Tool<typeof paramsSchema> => {
  const createExtractRefreshTaskTool = new Tool({
    server,
    name: 'create-extract-refresh-task',
    description: `
  Creates a new extract refresh task for a workbook or datasource.

  **Important:** This operation is only available on Tableau Cloud (API 3.20+).

  **Parameters:**
  - type: The refresh type - "FullRefresh" replaces all data, "IncrementalRefresh" adds new data
  - workbookId OR datasourceId: The ID of the workbook or datasource to refresh (exactly one required)
  - frequency: How often to run - "Hourly", "Daily", "Weekly", or "Monthly"
  - frequencyDetails: Optional timing configuration
    - start: Start time in HH:MM:SS format
    - end: End time in HH:MM:SS format (for hourly)
    - intervals: Array of interval objects with hours, weekDay, or monthDay

  **Example - Daily refresh at 2 AM:**
  {
    "type": "FullRefresh",
    "datasourceId": "abc123",
    "frequency": "Daily",
    "frequencyDetails": {
      "start": "02:00:00"
    }
  }

  **Example - Weekly refresh on Monday and Friday:**
  {
    "type": "IncrementalRefresh",
    "workbookId": "xyz789",
    "frequency": "Weekly",
    "frequencyDetails": {
      "start": "06:00:00",
      "intervals": {
        "interval": [
          { "weekDay": "Monday" },
          { "weekDay": "Friday" }
        ]
      }
    }
  }
  `,
    paramsSchema,
    annotations: {
      title: 'Create Extract Refresh Task',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { type, workbookId, datasourceId, frequency, frequencyDetails },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      // Validate that exactly one of workbookId or datasourceId is provided
      if ((!workbookId && !datasourceId) || (workbookId && datasourceId)) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Exactly one of workbookId or datasourceId must be provided.',
            },
          ],
          isError: true,
        };
      }

      const config = getConfig();
      return await createExtractRefreshTaskTool.logAndExecute({
        requestId,
        authInfo,
        args: { type, workbookId, datasourceId, frequency, frequencyDetails },
        callback: async () => {
          const result = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:create'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.extractRefreshMethods.createExtractRefreshTask({
                siteId: restApi.siteId,
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
        constrainSuccessResult: (result) => constrainCreateResult({ result }),
      });
    },
  });

  return createExtractRefreshTaskTool;
};

function constrainCreateResult({
  result,
}: {
  result: { extractRefresh: ExtractRefresh; schedule?: Schedule };
}): ConstrainedResult<{ extractRefresh: ExtractRefresh; schedule?: Schedule }> {
  return {
    type: 'success',
    result,
  };
}
