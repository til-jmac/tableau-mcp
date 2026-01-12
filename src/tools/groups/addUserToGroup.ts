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
  groupId: z.string(),
  userId: z.string(),
};

export const getAddUserToGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const addUserToGroupTool = new Tool({
    server,
    name: 'add-user-to-group',
    description: `
  Adds a user to the specified group.

  **Parameters:**
  - \`groupId\` (required): The LUID of the group
  - \`userId\` (required): The LUID of the user to add

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Example Usage:**
  - Add a user to a group:
      groupId: "abc123-def456"
      userId: "xyz789-uvw012"
  `,
    paramsSchema,
    annotations: {
      title: 'Add User to Group',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { groupId, userId },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await addUserToGroupTool.logAndExecute<User>({
        requestId,
        authInfo,
        args: { groupId, userId },
        callback: async () => {
          const user = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:groups:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.groupsMethods.addUserToGroup({
                siteId: restApi.siteId,
                groupId,
                userId,
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

  return addUserToGroupTool;
};
