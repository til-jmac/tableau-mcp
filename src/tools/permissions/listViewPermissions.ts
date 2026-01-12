import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Permissions } from '../../sdks/tableau/types/permissions.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';
import { formatCapabilitiesForDisplay } from '../../utils/permissions/capabilityValidator.js';

const paramsSchema = {
  viewId: z.string(),
};

export const getListViewPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listViewPermissionsTool = new Tool({
    server,
    name: 'list-view-permissions',
    description: `
Returns the permissions for the specified view, showing which users and groups have access and what capabilities they have.

**Parameters:**
- \`viewId\` (required): The LUID of the view

**Valid View Capabilities:**
${formatCapabilitiesForDisplay('views')}

**Example Usage:**
- List permissions for a view:
    viewId: "abc123-def456"
`,
    paramsSchema,
    annotations: {
      title: 'List View Permissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ viewId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await listViewPermissionsTool.logAndExecute<Permissions>({
        requestId,
        authInfo,
        args: { viewId },
        callback: async () => {
          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:permissions:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.permissionsMethods.getViewPermissions({
                siteId: restApi.siteId,
                viewId,
              });
            },
          });

          return new Ok(permissions);
        },
        constrainSuccessResult: (permissions) => {
          return {
            type: 'success',
            result: permissions,
          };
        },
      });
    },
  });

  return listViewPermissionsTool;
};
