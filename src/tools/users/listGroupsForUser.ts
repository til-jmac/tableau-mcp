import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Group } from '../../sdks/tableau/types/group.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  userId: z.string(),
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListGroupsForUserTool = (server: Server): Tool<typeof paramsSchema> => {
  const listGroupsForUserTool = new Tool({
    server,
    name: 'list-groups-for-user',
    description: `
  Retrieves a list of groups that the specified user belongs to. Use this tool to see what groups a user is a member of.

  **Parameters:**
  - \`userId\` (required): The LUID of the user

  **Example Usage:**
  - List all groups for a user:
      userId: "abc123-def456-ghi789"
  `,
    paramsSchema,
    annotations: {
      title: 'List Groups for User',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { userId, pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await listGroupsForUserTool.logAndExecute({
        requestId,
        authInfo,
        args: { userId, pageSize, limit },
        callback: async () => {
          const groups = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const groups = await paginate({
                pageConfig: {
                  pageSize,
                  limit: config.maxResultLimit
                    ? Math.min(config.maxResultLimit, limit ?? Number.MAX_SAFE_INTEGER)
                    : limit,
                },
                getDataFn: async (pageConfig) => {
                  const { pagination, groups: data } =
                    await restApi.usersMethods.listGroupsForUser({
                      siteId: restApi.siteId,
                      userId,
                      pageSize: pageConfig.pageSize,
                      pageNumber: pageConfig.pageNumber,
                    });

                  return { pagination, data };
                },
              });

              return groups;
            },
          });

          return new Ok(groups);
        },
        constrainSuccessResult: (groups) => constrainGroups({ groups }),
      });
    },
  });

  return listGroupsForUserTool;
};

function constrainGroups({ groups }: { groups: Array<Group> }): ConstrainedResult<Array<Group>> {
  if (groups.length === 0) {
    return {
      type: 'empty',
      message: 'The user is not a member of any groups.',
    };
  }

  return {
    type: 'success',
    result: groups,
  };
}
