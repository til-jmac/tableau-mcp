import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { BoundedContext, getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { ExtractRefreshTask } from '../../sdks/tableau/types/extractRefreshTask.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListExtractRefreshTasksTool = (server: Server): Tool<typeof paramsSchema> => {
  const listExtractRefreshTasksTool = new Tool({
    server,
    name: 'list-extract-refresh-tasks',
    description: `
  Retrieves a list of extract refresh tasks from a specified Tableau site. Extract refresh tasks define scheduled or on-demand data refreshes for workbooks and datasources with extracts.

  Use this tool when a user wants to:
  - See all scheduled extract refreshes
  - Monitor extract refresh task configurations
  - Find tasks for specific workbooks or datasources

  The response includes task details such as:
  - Task ID and type
  - Associated workbook or datasource
  - Schedule frequency and next run time
  - Consecutive failure count
  `,
    paramsSchema,
    annotations: {
      title: 'List Extract Refresh Tasks',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();
      return await listExtractRefreshTasksTool.logAndExecute({
        requestId,
        authInfo,
        args: { pageSize, limit },
        callback: async () => {
          const tasks = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:tasks:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const tasks = await paginate({
                pageConfig: {
                  pageSize,
                  limit: config.maxResultLimit
                    ? Math.min(config.maxResultLimit, limit ?? Number.MAX_SAFE_INTEGER)
                    : limit,
                },
                getDataFn: async (pageConfig) => {
                  const { pagination, tasks: data } =
                    await restApi.extractRefreshMethods.listExtractRefreshTasks({
                      siteId: restApi.siteId,
                      pageSize: pageConfig.pageSize,
                      pageNumber: pageConfig.pageNumber,
                    });

                  return { pagination, data };
                },
              });

              return tasks;
            },
          });

          return new Ok(tasks);
        },
        constrainSuccessResult: (tasks) =>
          constrainExtractRefreshTasks({ tasks, boundedContext: config.boundedContext }),
      });
    },
  });

  return listExtractRefreshTasksTool;
};

export function constrainExtractRefreshTasks({
  tasks,
  boundedContext,
}: {
  tasks: Array<ExtractRefreshTask>;
  boundedContext: BoundedContext;
}): ConstrainedResult<Array<ExtractRefreshTask>> {
  if (tasks.length === 0) {
    return {
      type: 'empty',
      message:
        'No extract refresh tasks were found. Either none exist or you do not have permission to view them.',
    };
  }

  const { workbookIds, datasourceIds } = boundedContext;

  // Filter by bounded context if configured
  if (workbookIds || datasourceIds) {
    tasks = tasks.filter((task) => {
      const workbookId = task.extractRefresh.workbook?.id;
      const datasourceId = task.extractRefresh.datasource?.id;

      if (workbookId && workbookIds && !workbookIds.has(workbookId)) {
        return false;
      }
      if (datasourceId && datasourceIds && !datasourceIds.has(datasourceId)) {
        return false;
      }
      return true;
    });
  }

  if (tasks.length === 0) {
    return {
      type: 'empty',
      message: [
        'The set of allowed workbooks/datasources that can be accessed is limited by the server configuration.',
        'While extract refresh tasks were found, they were all filtered out by the server configuration.',
      ].join(' '),
    };
  }

  return {
    type: 'success',
    result: tasks,
  };
}
