import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Group } from '../../sdks/tableau/types/group.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  groupId: z.string(),
  name: z.string().min(1).optional(),
  minimumSiteRole: z.string().optional(),
};

export const getUpdateGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const updateGroupTool = new Tool({
    server,
    name: 'update-group',
    description: `
  Updates an existing group on the specified Tableau site.

  **Parameters:**
  - \`groupId\` (required): The LUID of the group to update
  - \`name\` (optional): New name for the group
  - \`minimumSiteRole\` (optional): New minimum site role for users in this group

  **Minimum Site Roles:**
  Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Viewer, Unlicensed

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Example Usage:**
  - Rename a group:
      groupId: "abc123-def456"
      name: "Marketing Analytics Team"
  - Change minimum site role:
      groupId: "abc123-def456"
      minimumSiteRole: "Explorer"
  `,
    paramsSchema,
    annotations: {
      title: 'Update Group',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { groupId, name, minimumSiteRole },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await updateGroupTool.logAndExecute<Group>({
        requestId,
        authInfo,
        args: { groupId, name, minimumSiteRole },
        callback: async () => {
          const group = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:groups:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.groupsMethods.updateGroup({
                siteId: restApi.siteId,
                groupId,
                group: {
                  name,
                  minimumSiteRole,
                },
              });
            },
          });

          return new Ok(group);
        },
        constrainSuccessResult: (group) => {
          return {
            type: 'success',
            result: group,
          };
        },
      });
    },
  });

  return updateGroupTool;
};
