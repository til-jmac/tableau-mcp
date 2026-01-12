import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  userId: z.string(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this user',
  }),
  mapAssetsTo: z.string().optional(),
};

export type DeleteUserError = {
  type: 'confirmation-required';
  message: string;
};

export const getDeleteUserTool = (server: Server): Tool<typeof paramsSchema> => {
  const deleteUserTool = new Tool({
    server,
    name: 'delete-user',
    description: `
  **WARNING: This is a destructive operation that cannot be undone.**

  Removes a user from the specified Tableau site. When a user is deleted, their content can optionally be reassigned to another user.

  **Parameters:**
  - \`userId\` (required): The LUID of the user to delete
  - \`confirm\` (required): Must be set to \`true\` to confirm deletion
  - \`mapAssetsTo\` (optional): User ID to reassign content ownership to

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Important Notes:**
  - This operation cannot be undone
  - User's content will be orphaned unless mapAssetsTo is specified
  - Consider reassigning assets before deletion

  **Example Usage:**
  - Delete a user (with confirmation):
      userId: "abc123-def456"
      confirm: true
  - Delete a user and reassign their content:
      userId: "abc123-def456"
      confirm: true
      mapAssetsTo: "xyz789-uvw012"
  `,
    paramsSchema,
    annotations: {
      title: 'Delete User',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { userId, confirm, mapAssetsTo },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await deleteUserTool.logAndExecute<void, DeleteUserError>({
        requestId,
        authInfo,
        args: { userId, confirm, mapAssetsTo },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message: 'You must explicitly set confirm: true to delete this user',
            });
          }

          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:users:delete'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              await restApi.usersMethods.deleteUser({
                siteId: restApi.siteId,
                userId,
                mapAssetsTo,
              });
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'User deleted successfully.',
          };
        },
        getErrorText: (error: DeleteUserError) => {
          switch (error.type) {
            case 'confirmation-required':
              return error.message;
          }
        },
      });
    },
  });

  return deleteUserTool;
};
