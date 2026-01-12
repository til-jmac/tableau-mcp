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
  userId: z.string(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  siteRole: z.string().optional(),
  authSetting: z.string().optional(),
};

export const getUpdateUserTool = (server: Server): Tool<typeof paramsSchema> => {
  const updateUserTool = new Tool({
    server,
    name: 'update-user',
    description: `
  Updates an existing user on the specified Tableau site. You can modify the user's full name, email, site role, or authentication settings.

  **Parameters:**
  - \`userId\` (required): The LUID of the user to update
  - \`fullName\` (optional): New display name for the user
  - \`email\` (optional): New email address
  - \`siteRole\` (optional): New site role
  - \`authSetting\` (optional): New authentication type

  **Site Roles:**
  Creator, Explorer, ExplorerCanPublish, SiteAdministratorExplorer, SiteAdministratorCreator, Viewer, Unlicensed

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Example Usage:**
  - Update a user's full name:
      userId: "abc123-def456"
      fullName: "John Smith Jr."
  - Change a user's site role:
      userId: "abc123-def456"
      siteRole: "Creator"
  - Update email and site role:
      userId: "abc123-def456"
      email: "john.smith@example.com"
      siteRole: "Explorer"
  `,
    paramsSchema,
    annotations: {
      title: 'Update User',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { userId, fullName, email, siteRole, authSetting },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await updateUserTool.logAndExecute<User>({
        requestId,
        authInfo,
        args: { userId, fullName, email, siteRole, authSetting },
        callback: async () => {
          const user = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:users:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.usersMethods.updateUser({
                siteId: restApi.siteId,
                userId,
                user: {
                  fullName,
                  email,
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

  return updateUserTool;
};
