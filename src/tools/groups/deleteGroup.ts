import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  groupId: z.string(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this group',
  }),
};

export type DeleteGroupError = {
  type: 'confirmation-required';
  message: string;
};

export const getDeleteGroupTool = (server: Server): Tool<typeof paramsSchema> => {
  const deleteGroupTool = new Tool({
    server,
    name: 'delete-group',
    description: `
  **WARNING: This is a destructive operation that cannot be undone.**

  Deletes the specified group from the Tableau site. Users in the group will no longer have any permissions granted through this group.

  **Parameters:**
  - \`groupId\` (required): The LUID of the group to delete
  - \`confirm\` (required): Must be set to \`true\` to confirm deletion

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role

  **Important Notes:**
  - This operation cannot be undone
  - Users in the group will lose any permissions granted through this group
  - Users will NOT be deleted from the site

  **Example Usage:**
  - Delete a group (with confirmation):
      groupId: "abc123-def456"
      confirm: true
  `,
    paramsSchema,
    annotations: {
      title: 'Delete Group',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { groupId, confirm },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await deleteGroupTool.logAndExecute<void, DeleteGroupError>({
        requestId,
        authInfo,
        args: { groupId, confirm },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message: 'You must explicitly set confirm: true to delete this group',
            });
          }

          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:groups:delete'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              await restApi.groupsMethods.deleteGroup({
                siteId: restApi.siteId,
                groupId,
              });
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'Group deleted successfully.',
          };
        },
        getErrorText: (error: DeleteGroupError) => {
          switch (error.type) {
            case 'confirmation-required':
              return error.message;
          }
        },
      });
    },
  });

  return deleteGroupTool;
};
