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
  name: z.string().min(1),
  minimumSiteRole: z.string().optional(),
};

export const getCreateGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const createGroupTool = new Tool({
    server,
    name: 'create-group',
    description: `
  Creates a new group on the specified Tableau site.

  **Parameters:**
  - \`name\` (required): The name for the new group
  - \`minimumSiteRole\` (optional): The minimum site role for users in this group

  **Minimum Site Roles:**
  Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Viewer, Unlicensed

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Example Usage:**
  - Create a basic group:
      name: "Marketing Team"
  - Create a group with minimum site role:
      name: "Data Analysts"
      minimumSiteRole: "Creator"
  `,
    paramsSchema,
    annotations: {
      title: 'Create Group',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { name, minimumSiteRole },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await createGroupTool.logAndExecute<Group>({
        requestId,
        authInfo,
        args: { name, minimumSiteRole },
        callback: async () => {
          const group = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:groups:create'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.groupsMethods.createGroup({
                siteId: restApi.siteId,
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

  return createGroupTool;
};
