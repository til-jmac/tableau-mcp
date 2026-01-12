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
  workbookId: z.string(),
};

export const getListWorkbookPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listWorkbookPermissionsTool = new Tool({
    server,
    name: 'list-workbook-permissions',
    description: `
Returns the permissions for the specified workbook, showing which users and groups have access and what capabilities they have.

**Parameters:**
- \`workbookId\` (required): The LUID of the workbook

**Valid Workbook Capabilities:**
${formatCapabilitiesForDisplay('workbooks')}

**Example Usage:**
- List permissions for a workbook:
    workbookId: "abc123-def456"
`,
    paramsSchema,
    annotations: {
      title: 'List Workbook Permissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ workbookId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await listWorkbookPermissionsTool.logAndExecute<Permissions>({
        requestId,
        authInfo,
        args: { workbookId },
        callback: async () => {
          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.permissionsMethods.getWorkbookPermissions({
                siteId: restApi.siteId,
                workbookId,
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

  return listWorkbookPermissionsTool;
};
