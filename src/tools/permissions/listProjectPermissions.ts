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
  projectId: z.string(),
};

export const getListProjectPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listProjectPermissionsTool = new Tool({
    server,
    name: 'list-project-permissions',
    description: `
Returns the permissions for the specified project, showing which users and groups have access and what capabilities they have.

**Parameters:**
- \`projectId\` (required): The LUID of the project

**Valid Project Capabilities:**
${formatCapabilitiesForDisplay('projects')}

**Example Usage:**
- List permissions for a project:
    projectId: "abc123-def456"
`,
    paramsSchema,
    annotations: {
      title: 'List Project Permissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ projectId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await listProjectPermissionsTool.logAndExecute<Permissions>({
        requestId,
        authInfo,
        args: { projectId },
        callback: async () => {
          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:permissions:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.permissionsMethods.getProjectPermissions({
                siteId: restApi.siteId,
                projectId,
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

  return listProjectPermissionsTool;
};
