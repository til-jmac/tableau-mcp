import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';
import {
  validateCapability,
  formatCapabilitiesForDisplay,
  CapabilityValidationError,
} from '../../utils/permissions/capabilityValidator.js';

const paramsSchema = {
  resourceType: z.enum(['projects', 'workbooks', 'datasources', 'views']),
  resourceId: z.string(),
  granteeType: z.enum(['users', 'groups']),
  granteeId: z.string(),
  capabilityName: z.string(),
  capabilityMode: z.enum(['Allow', 'Deny']),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this permission',
  }),
};

export type DeletePermissionError =
  | CapabilityValidationError
  | { type: 'confirmation-required'; message: string };

export const getDeletePermissionTool = (server: Server): Tool<typeof paramsSchema> => {
  const deletePermissionTool = new Tool({
    server,
    name: 'delete-permission',
    description: `
**WARNING: This operation removes a specific permission from a resource.**

Deletes a specific permission capability from a resource for a user or group.

**Parameters:**
- \`resourceType\` (required): The type of resource (projects, workbooks, datasources, views)
- \`resourceId\` (required): The LUID of the resource
- \`granteeType\` (required): 'users' or 'groups'
- \`granteeId\` (required): The LUID of the user or group
- \`capabilityName\` (required): The name of the capability to remove
- \`capabilityMode\` (required): The mode of the capability (Allow or Deny)
- \`confirm\` (required): Must be set to \`true\` to confirm deletion

**Required Permissions:**
- ChangePermissions capability on the resource, or Server/Site Administrator role

**Valid Capabilities by Resource Type:**
- projects: ${formatCapabilitiesForDisplay('projects')}
- workbooks: ${formatCapabilitiesForDisplay('workbooks')}
- datasources: ${formatCapabilitiesForDisplay('datasources')}
- views: ${formatCapabilitiesForDisplay('views')}

**Example Usage:**
- Remove Read permission from a user on a workbook:
    resourceType: "workbooks"
    resourceId: "workbook-luid"
    granteeType: "users"
    granteeId: "user-luid"
    capabilityName: "Read"
    capabilityMode: "Allow"
    confirm: true
`,
    paramsSchema,
    annotations: {
      title: 'Delete Permission',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { resourceType, resourceId, granteeType, granteeId, capabilityName, capabilityMode, confirm },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await deletePermissionTool.logAndExecute<void, DeletePermissionError>({
        requestId,
        authInfo,
        args: { resourceType, resourceId, granteeType, granteeId, capabilityName, capabilityMode, confirm },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message: 'You must explicitly set confirm: true to delete this permission',
            });
          }

          // Validate capability for the resource type
          const validationResult = validateCapability(resourceType, capabilityName);
          if (validationResult.isErr()) {
            return new Err(validationResult.error);
          }

          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:permissions:delete'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              switch (resourceType) {
                case 'projects':
                  await restApi.permissionsMethods.deleteProjectPermission({
                    siteId: restApi.siteId,
                    projectId: resourceId,
                    granteeType,
                    granteeId,
                    capabilityName,
                    capabilityMode,
                  });
                  break;
                case 'workbooks':
                  await restApi.permissionsMethods.deleteWorkbookPermission({
                    siteId: restApi.siteId,
                    workbookId: resourceId,
                    granteeType,
                    granteeId,
                    capabilityName,
                    capabilityMode,
                  });
                  break;
                case 'datasources':
                  await restApi.permissionsMethods.deleteDatasourcePermission({
                    siteId: restApi.siteId,
                    datasourceId: resourceId,
                    granteeType,
                    granteeId,
                    capabilityName,
                    capabilityMode,
                  });
                  break;
                case 'views':
                  await restApi.permissionsMethods.deleteViewPermission({
                    siteId: restApi.siteId,
                    viewId: resourceId,
                    granteeType,
                    granteeId,
                    capabilityName,
                    capabilityMode,
                  });
                  break;
              }
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'Permission deleted successfully.',
          };
        },
        getErrorText: (error: DeletePermissionError) => {
          switch (error.type) {
            case 'confirmation-required':
              return error.message;
            case 'invalid-capability':
              return error.message;
          }
        },
      });
    },
  });

  return deletePermissionTool;
};
