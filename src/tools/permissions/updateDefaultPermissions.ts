import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Permissions, defaultPermissionResourceTypeSchema } from '../../sdks/tableau/types/permissions.js';
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
  projectId: z.string(),
  resourceType: defaultPermissionResourceTypeSchema,
  granteeType: z.enum(['user', 'group']),
  granteeId: z.string(),
  capabilities: z.array(capabilityInputSchema),
};

export type UpdateDefaultPermissionsError = CapabilityValidationError;

export const getUpdateDefaultPermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const updateDefaultPermissionsTool = new Tool({
    server,
    name: 'update-default-permissions',
    description: `
Updates the default permissions for a specific resource type within a project. Default permissions are applied to new content created in the project.

**Parameters:**
- \`projectId\` (required): The LUID of the project
- \`resourceType\` (required): The type of resource (workbooks, datasources, flows, metrics, lenses, dataroles, virtualconnections, databases, tables)
- \`granteeType\` (required): Whether granting to a 'user' or 'group'
- \`granteeId\` (required): The LUID of the user or group
- \`capabilities\` (required): Array of capabilities, each with 'name' and 'mode' (Allow or Deny)

**Required Permissions:**
- Project Leader capability or Server/Site Administrator role

**Valid Capabilities by Resource Type:**
- workbooks: ${formatCapabilitiesForDisplay('workbooks')}
- datasources: ${formatCapabilitiesForDisplay('datasources')}
- flows: ${formatCapabilitiesForDisplay('flows')}

**Example Usage:**
- Set default workbook permissions for a group:
    projectId: "project-luid"
    resourceType: "workbooks"
    granteeType: "group"
    granteeId: "group-luid"
    capabilities: [{"name": "Read", "mode": "Allow"}, {"name": "Filter", "mode": "Allow"}]
`,
    paramsSchema,
    annotations: {
      title: 'Update Default Permissions',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { projectId, resourceType, granteeType, granteeId, capabilities },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await updateDefaultPermissionsTool.logAndExecute<Permissions, UpdateDefaultPermissionsError>({
        requestId,
        authInfo,
        args: { projectId, resourceType, granteeType, granteeId, capabilities },
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
              return await restApi.permissionsMethods.updateDefaultPermissions({
                siteId: restApi.siteId,
                projectId,
                resourceType,
                granteeCapabilities,
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
        getErrorText: (error: UpdateDefaultPermissionsError) => {
          switch (error.type) {
            case 'invalid-capability':
              return error.message;
          }
        },
      });
    },
  });

  return updateDefaultPermissionsTool;
};
