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
  datasourceId: z.string(),
};

export const getListDatasourcePermissionsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listDatasourcePermissionsTool = new Tool({
    server,
    name: 'list-datasource-permissions',
    description: `
Returns the permissions for the specified datasource, showing which users and groups have access and what capabilities they have.

**Parameters:**
- \`datasourceId\` (required): The LUID of the datasource

**Valid Datasource Capabilities:**
${formatCapabilitiesForDisplay('datasources')}

**Example Usage:**
- List permissions for a datasource:
    datasourceId: "abc123-def456"
`,
    paramsSchema,
    annotations: {
      title: 'List Datasource Permissions',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ datasourceId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await listDatasourcePermissionsTool.logAndExecute<Permissions>({
        requestId,
        authInfo,
        args: { datasourceId },
        callback: async () => {
          const permissions = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.permissionsMethods.getDatasourcePermissions({
                siteId: restApi.siteId,
                datasourceId,
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

  return listDatasourcePermissionsTool;
};
