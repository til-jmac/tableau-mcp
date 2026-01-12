import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Job } from '../../sdks/tableau/types/extractRefreshTask.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  taskId: z.string(),
};

export const getRunExtractRefreshTaskTool = (server: Server): Tool<typeof paramsSchema> => {
  const runExtractRefreshTaskTool = new Tool({
    server,
    name: 'run-extract-refresh-task',
    description: `
  Runs an extract refresh task immediately, outside of its normal schedule.

  Use this tool when a user wants to:
  - Trigger an immediate data refresh
  - Test a newly created extract refresh task
  - Manually refresh data after upstream changes

  **Parameters:**
  - taskId: The ID of the extract refresh task to run (required)

  **Returns:**
  A job object containing the job ID that can be used to track the refresh progress.
  The job runs asynchronously - this tool returns immediately after the job is queued.

  **Note:** This does not modify the task's schedule. The task will continue to run at its scheduled times in addition to this immediate run.
  `,
    paramsSchema,
    annotations: {
      title: 'Run Extract Refresh Task',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async ({ taskId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();
      return await runExtractRefreshTaskTool.logAndExecute({
        requestId,
        authInfo,
        args: { taskId },
        callback: async () => {
          const job = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:run'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.extractRefreshMethods.runExtractRefreshTask({
                siteId: restApi.siteId,
                taskId,
              });
            },
          });

          return new Ok(job);
        },
        constrainSuccessResult: (job) => constrainRunResult({ job }),
      });
    },
  });

  return runExtractRefreshTaskTool;
};

function constrainRunResult({ job }: { job: Job }): ConstrainedResult<Job> {
  return {
    type: 'success',
    result: job,
  };
}
