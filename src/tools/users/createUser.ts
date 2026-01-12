import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { User } from '../../sdks/tableau/types/user.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  name: z.string().min(1),
  siteRole: z.string().min(1),
  authSetting: z.string().optional(),
};

export const getCreateUserTool = (server: Server): Tool<typeof paramsSchema> => {
  const createUserTool = new Tool({
    server,
    name: 'create-user',
    description: `
  Adds a new user to the specified Tableau site.

  **Parameters:**
  - \`name\` (required): The username for the new user
  - \`siteRole\` (required): The site role for the user
  - \`authSetting\` (optional): The authentication type (ServerDefault, SAML, etc.)

  **Site Roles:**
  - \`Creator\`: Can create and publish content
  - \`Explorer\`: Can explore and interact with content
  - \`ExplorerCanPublish\`: Explorer who can also publish
  - \`SiteAdministratorExplorer\`: Site admin with Explorer capabilities
  - \`SiteAdministratorCreator\`: Site admin with Creator capabilities
  - \`Viewer\`: Can only view content
  - \`Unlicensed\`: No license assigned

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Example Usage:**
  - Create a new Creator user:
      name: "john.smith"
      siteRole: "Creator"
  - Create a new Viewer with SAML auth:
      name: "jane.doe"
      siteRole: "Viewer"
      authSetting: "SAML"
  `,
    paramsSchema,
    annotations: {
      title: 'Create User',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { name, siteRole, authSetting },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await createUserTool.logAndExecute<User>({
        requestId,
        authInfo,
        args: { name, siteRole, authSetting },
        callback: async () => {
          const user = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:users:create'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.usersMethods.createUser({
                siteId: restApi.siteId,
                user: {
                  name,
                  siteRole,
                  authSetting,
                },
              });
            },
          });

          return new Ok(user);
        },
        constrainSuccessResult: (user) => {
          return {
            type: 'success',
            result: user,
          };
        },
      });
    },
  });

  return createUserTool;
};
