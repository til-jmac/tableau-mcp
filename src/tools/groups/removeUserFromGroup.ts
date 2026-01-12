import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  groupId: z.string(),
  userId: z.string(),
};

export const getRemoveUserFromGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const removeUserFromGroupTool = new Tool({
    server,
    name: 'remove-user-from-group',
    description: `
  Removes a user from the specified group.

  **Parameters:**
  - \`groupId\` (required): The LUID of the group
  - \`userId\` (required): The LUID of the user to remove

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Important Notes:**
  - The user will lose any permissions granted through this group
  - The user will NOT be deleted from the site

  **Example Usage:**
  - Remove a user from a group:
      groupId: "abc123-def456"
      userId: "xyz789-uvw012"
  `,
    paramsSchema,
    annotations: {
      title: 'Remove User from Group',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { groupId, userId },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await removeUserFromGroupTool.logAndExecute<void>({
        requestId,
        authInfo,
        args: { groupId, userId },
        callback: async () => {
          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:groups:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              await restApi.groupsMethods.removeUserFromGroup({
                siteId: restApi.siteId,
                groupId,
                userId,
              });
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'User removed from group successfully.',
          };
        },
      });
    },
  });

  return removeUserFromGroupTool;
};
