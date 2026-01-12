import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Permissions, permissionResourceTypeSchema } from '../../sdks/tableau/types/permissions.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';
import {
  validateCapabilities,
  formatCapabilitiesForDisplay,
  CapabilityValidationError,
} from '../../utils/permissions/capabilityValidator.js';

const capabilityInputSchema = z.object({
  name: z.string(),
  mode: z.enum(['Allow', 'Deny']),
});

const paramsSchema = {
  resourceType: z.enum(['projects', 'workbooks', 'datasources', 'views']),
  resourceId: z.string(),
  granteeType: z.enum(['user', 'group']),
  granteeId: z.string(),
  capabilities: z.array(capabilityInputSchema),
};

export type AddPermissionsError = CapabilityValidationError;

export const getAddPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const addPermissionsTool = new Tool({
    server,
    name: 'add-permissions',
    description: `
Adds permissions to a resource (project, workbook, datasource, or view) for a specific user or group.

**Parameters:**
- \`resourceType\` (required): The type of resource (projects, workbooks, datasources, views)
- \`resourceId\` (required): The LUID of the resource
- \`granteeType\` (required): Whether granting to a 'user' or 'group'
- \`granteeId\` (required): The LUID of the user or group
- \`capabilities\` (required): Array of capabilities, each with 'name' and 'mode' (Allow or Deny)

**Valid Capabilities by Resource Type:**
- projects: ${formatCapabilitiesForDisplay('projects')}
- workbooks: ${formatCapabilitiesForDisplay('workbooks')}
- datasources: ${formatCapabilitiesForDisplay('datasources')}
- views: ${formatCapabilitiesForDisplay('views')}

**Required Permissions:**
- ChangePermissions capability on the resource, or Server/Site Administrator role

**Example Usage:**
- Grant Read access to a workbook for a user:
    resourceType: "workbooks"
    resourceId: "workbook-luid"
    granteeType: "user"
    granteeId: "user-luid"
    capabilities: [{"name": "Read", "mode": "Allow"}]

- Grant multiple capabilities to a group on a project:
    resourceType: "projects"
    resourceId: "project-luid"
    granteeType: "group"
    granteeId: "group-luid"
    capabilities: [{"name": "Read", "mode": "Allow"}, {"name": "Write", "mode": "Allow"}]
`,
    paramsSchema,
    annotations: {
      title: 'Add Permissions',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { resourceType, resourceId, granteeType, granteeId, capabilities },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await addPermissionsTool.logAndExecute<Permissions, AddPermissionsError>({
        requestId,
        authInfo,
        args: { resourceType, resourceId, granteeType, granteeId, capabilities },
        callback: async () => {
          // Validate capabilities for the resource type
          const validationResult = validateCapabilities(resourceType, capabilities);
          if (validationResult.isErr()) {
            return new Err(validationResult.error);
          }

          const granteeCapabilities = [
            {
              ...(granteeType === 'user' ? { user: { id: granteeId } } : { group: { id: granteeId } }),
              capabilities: {
                capability: capabilities,
              },
            },
          ];

          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:permissions:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              switch (resourceType) {
                case 'projects':
                  return await restApi.permissionsMethods.addProjectPermissions({
                    siteId: restApi.siteId,
                    projectId: resourceId,
                    granteeCapabilities,
                  });
                case 'workbooks':
                  return await restApi.permissionsMethods.addWorkbookPermissions({
                    siteId: restApi.siteId,
                    workbookId: resourceId,
                    granteeCapabilities,
                  });
                case 'datasources':
                  return await restApi.permissionsMethods.addDatasourcePermissions({
                    siteId: restApi.siteId,
                    datasourceId: resourceId,
                    granteeCapabilities,
                  });
                case 'views':
                  return await restApi.permissionsMethods.addViewPermissions({
                    siteId: restApi.siteId,
                    viewId: resourceId,
                    granteeCapabilities,
                  });
              }
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
        getErrorText: (error: AddPermissionsError) => {
          switch (error.type) {
            case 'invalid-capability':
              return error.message;
          }
        },
      });
    },
  });

  return addPermissionsTool;
};
