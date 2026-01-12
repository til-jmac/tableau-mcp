import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Permissions, defaultPermissionResourceTypeSchema } from '../../sdks/tableau/types/permissions.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';
import { formatCapabilitiesForDisplay } from '../../utils/permissions/capabilityValidator.js';

const paramsSchema = {
  projectId: z.string(),
  resourceType: defaultPermissionResourceTypeSchema,
};

export const getListDefaultPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listDefaultPermissionsTool = new Tool({
    server,
    name: 'list-default-permissions',
    description: `
Returns the default permissions for a specific resource type within a project. Default permissions are applied to new content created in the project.

**Parameters:**
- \`projectId\` (required): The LUID of the project
- \`resourceType\` (required): The type of resource. Valid values: workbooks, datasources, flows, metrics, lenses, dataroles, virtualconnections, databases, tables

**Example Usage:**
- List default workbook permissions for a project:
    projectId: "abc123-def456"
    resourceType: "workbooks"

**Valid Capabilities by Resource Type:**
- workbooks: ${formatCapabilitiesForDisplay('workbooks')}
- datasources: ${formatCapabilitiesForDisplay('datasources')}
- flows: ${formatCapabilitiesForDisplay('flows')}
`,
    paramsSchema,
    annotations: {
      title: 'List Default Permissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { projectId, resourceType },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await listDefaultPermissionsTool.logAndExecute<Permissions>({
        requestId,
        authInfo,
        args: { projectId, resourceType },
        callback: async () => {
          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:permissions:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.permissionsMethods.getDefaultPermissions({
                siteId: restApi.siteId,
                projectId,
                resourceType,
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

  return listDefaultPermissionsTool;
};
