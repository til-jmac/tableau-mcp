import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { User } from '../../sdks/tableau/types/user.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { genericFilterDescription } from '../genericFilterDescription.js';
import { ConstrainedResult, Tool } from '../tool.js';
import { parseAndValidateUsersFilterString } from './usersFilterUtils.js';

const paramsSchema = {
  filter: z.string().optional(),
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListUsersTool = (server: Server): Tool<typeof paramsSchema> => {
  const listUsersTool = new Tool({
    server,
    name: 'list-users',
    description: `
  Retrieves a list of users from a specified Tableau site using the Tableau REST API. Supports optional filtering via field:operator:value expressions for precise user discovery.

  **Supported Filter Fields and Operators**
  | Field        | Operators            |
  |--------------|----------------------|
  | name         | eq, in               |
  | siteRole     | eq, in               |
  | lastLogin    | eq, gt, gte, lt, lte |
  | friendlyName | eq, in, has          |

  ${genericFilterDescription}

  **Site Roles:**
  Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Viewer, Unlicensed

  **Example Usage:**
  - List all users on a site
  - List users with the name "john.smith":
      filter: "name:eq:john.smith"
  - List users with the Creator site role:
      filter: "siteRole:eq:Creator"
  - List users who logged in after a specific date:
      filter: "lastLogin:gt:2023-01-01T00:00:00Z"
  `,
    paramsSchema,
    annotations: {
      title: 'List Users',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { filter, pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();
      const validatedFilter = filter ? parseAndValidateUsersFilterString(filter) : undefined;
      return await listUsersTool.logAndExecute({
        requestId,
        authInfo,
        args: { filter, pageSize, limit },
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
                  const { pagination, users: data } = await restApi.usersMethods.listUsers({
                    siteId: restApi.siteId,
                    filter: validatedFilter,
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

  return listUsersTool;
};

export function constrainUsers({ users }: { users: Array<User> }): ConstrainedResult<Array<User>> {
  if (users.length === 0) {
    return {
      type: 'empty',
      message:
        'No users were found. Either none exist or you do not have permission to view them.',
    };
  }

  return {
    type: 'success',
    result: users,
  };
}
