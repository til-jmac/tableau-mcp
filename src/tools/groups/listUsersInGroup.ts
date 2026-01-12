import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { User } from '../../sdks/tableau/types/user.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { ConstrainedResult, Tool } from '../tool.js';

const paramsSchema = {
  groupId: z.string(),
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListUsersInGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const listUsersInGroupTool = new Tool({
    server,
    name: 'list-users-in-group',
    description: `
  Retrieves a list of users that are members of the specified group.

  **Parameters:**
  - \`groupId\` (required): The LUID of the group

  **Example Usage:**
  - List all users in a group:
      groupId: "abc123-def456-ghi789"
  `,
    paramsSchema,
    annotations: {
      title: 'List Users in Group',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { groupId, pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await listUsersInGroupTool.logAndExecute({
        requestId,
        authInfo,
        args: { groupId, pageSize, limit },
        callback: async () => {
          const users = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const users = await paginate({
                pageConfig: {
                  pageSize,
                  limit: config.maxResultLimit
                    ? Math.min(config.maxResultLimit, limit ?? Number.MAX_SAFE_INTEGER)
                    : limit,
                },
                getDataFn: async (pageConfig) => {
                  const { pagination, users: data } =
                    await restApi.groupsMethods.listUsersInGroup({
                      siteId: restApi.siteId,
                      groupId,
                      pageSize: pageConfig.pageSize,
                      pageNumber: pageConfig.pageNumber,
                    });

                  return { pagination, data };
                },
              });

              return users;
            },
          });

          return new Ok(users);
        },
        constrainSuccessResult: (users) => constrainUsers({ users }),
      });
    },
  });

  return listUsersInGroupTool;
};

function constrainUsers({ users }: { users: Array<User> }): ConstrainedResult<Array<User>> {
  if (users.length === 0) {
    return {
      type: 'empty',
      message: 'The group has no members.',
    };
  }

  return {
    type: 'success',
    result: users,
  };
}
