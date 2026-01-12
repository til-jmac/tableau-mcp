import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Group } from '../../sdks/tableau/types/group.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { genericFilterDescription } from '../genericFilterDescription.js';
import { ConstrainedResult, Tool } from '../tool.js';
import { parseAndValidateGroupsFilterString } from './groupsFilterUtils.js';

const paramsSchema = {
  filter: z.string().optional(),
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListGroupsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listGroupsTool = new Tool({
    server,
    name: 'list-groups',
    description: `
  Retrieves a list of groups from a specified Tableau site using the Tableau REST API. Groups are used to organize users and manage permissions. Supports optional filtering via field:operator:value expressions.

  **Supported Filter Fields and Operators**
  | Field           | Operators   |
  |-----------------|-------------|
  | name            | eq, in, has |
  | domainName      | eq, in, has |
  | minimumSiteRole | eq, in      |
  | isLocal         | eq          |

  ${genericFilterDescription}

  **Example Usage:**
  - List all groups on a site
  - List groups with the name "Marketing":
      filter: "name:eq:Marketing"
  - List local groups:
      filter: "isLocal:eq:true"
  - List groups with a minimum site role of Creator:
      filter: "minimumSiteRole:eq:Creator"
  `,
    paramsSchema,
    annotations: {
      title: 'List Groups',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { filter, pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();
      const validatedFilter = filter ? parseAndValidateGroupsFilterString(filter) : undefined;
      return await listGroupsTool.logAndExecute({
        requestId,
        authInfo,
        args: { filter, pageSize, limit },
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
                  const { pagination, groups: data } = await restApi.groupsMethods.listGroups({
                    siteId: restApi.siteId,
                    filter: validatedFilter,
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

  return listGroupsTool;
};

export function constrainGroups({
  groups,
}: {
  groups: Array<Group>;
}): ConstrainedResult<Array<Group>> {
  if (groups.length === 0) {
    return {
      type: 'empty',
      message:
        'No groups were found. Either none exist or you do not have permission to view them.',
    };
  }

  return {
    type: 'success',
    result: groups,
  };
}
