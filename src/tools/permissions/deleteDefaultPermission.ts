import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { defaultPermissionResourceTypeSchema } from '../../sdks/tableau/types/permissions.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';
import {
  validateCapability,
  formatCapabilitiesForDisplay,
  CapabilityValidationError,
} from '../../utils/permissions/capabilityValidator.js';

const paramsSchema = {
  projectId: z.string(),
  resourceType: defaultPermissionResourceTypeSchema,
  granteeType: z.enum(['users', 'groups']),
  granteeId: z.string(),
  capabilityName: z.string(),
  capabilityMode: z.enum(['Allow', 'Deny']),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this default permission',
  }),
};

export type DeleteDefaultPermissionError =
  | CapabilityValidationError
  | { type: 'confirmation-required'; message: string };

export const getDeleteDefaultPermissionTool = (server: Server): Tool<typeof paramsSchema> => {
  const deleteDefaultPermissionTool = new Tool({
    server,
    name: 'delete-default-permission',
    description: `
**WARNING: This operation removes a default permission from a project.**

Deletes a specific default permission capability from a project for a user or group. Default permissions affect new content created in the project.

**Parameters:**
- \`projectId\` (required): The LUID of the project
- \`resourceType\` (required): The type of resource (workbooks, datasources, flows, metrics, lenses, dataroles, virtualconnections, databases, tables)
- \`granteeType\` (required): 'users' or 'groups'
- \`granteeId\` (required): The LUID of the user or group
- \`capabilityName\` (required): The name of the capability to remove
- \`capabilityMode\` (required): The mode of the capability (Allow or Deny)
- \`confirm\` (required): Must be set to \`true\` to confirm deletion

**Required Permissions:**
- Project Leader capability or Server/Site Administrator role

**Valid Capabilities by Resource Type:**
- workbooks: ${formatCapabilitiesForDisplay('workbooks')}
- datasources: ${formatCapabilitiesForDisplay('datasources')}
- flows: ${formatCapabilitiesForDisplay('flows')}

**Example Usage:**
- Remove default Read permission for workbooks from a group:
    projectId: "project-luid"
    resourceType: "workbooks"
    granteeType: "groups"
    granteeId: "group-luid"
    capabilityName: "Read"
    capabilityMode: "Allow"
    confirm: true
`,
    paramsSchema,
    annotations: {
      title: 'Delete Default Permission',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { projectId, resourceType, granteeType, granteeId, capabilityName, capabilityMode, confirm },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await deleteDefaultPermissionTool.logAndExecute<void, DeleteDefaultPermissionError>({
        requestId,
        authInfo,
        args: { projectId, resourceType, granteeType, granteeId, capabilityName, capabilityMode, confirm },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message: 'You must explicitly set confirm: true to delete this default permission',
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
              await restApi.permissionsMethods.deleteDefaultPermission({
                siteId: restApi.siteId,
                projectId,
                resourceType,
                granteeType,
                granteeId,
                capabilityName,
                capabilityMode,
              });
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'Default permission deleted successfully.',
          };
        },
        getErrorText: (error: DeleteDefaultPermissionError) => {
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

  return deleteDefaultPermissionTool;
};
