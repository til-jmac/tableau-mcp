import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { resourceAccessChecker } from '../resourceAccessChecker.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  projectId: z.string(),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'You must explicitly set confirm: true to delete this project',
  }),
};

export type DeleteProjectError =
  | {
      type: 'project-not-allowed';
      message: string;
    }
  | {
      type: 'confirmation-required';
      message: string;
    };

export const getDeleteProjectTool = (server: Server): Tool<typeof paramsSchema> => {
  const deleteProjectTool = new Tool({
    server,
    name: 'delete-project',
    description: `
  **WARNING: This is a destructive operation that cannot be undone.**

  Deletes the specified project from the Tableau site. When a project is deleted, its content (workbooks, data sources, etc.) may be moved to the parent project or the default project, depending on the server configuration.

  **Parameters:**
  - \`projectId\` (required): The LUID of the project to delete
  - \`confirm\` (required): Must be set to \`true\` to confirm deletion

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role
  - This operation requires administrative privileges

  **Important Notes:**
  - Deleting a project does NOT delete its content (workbooks, datasources, views)
  - Content is typically moved to the parent project or the default project
  - Nested child projects may also be affected
  - This operation cannot be undone

  **Example Usage:**
  - Delete a project (with confirmation):
      projectId: "abc123-def456"
      confirm: true
  `,
    paramsSchema,
    annotations: {
      title: 'Delete Project',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { projectId, confirm },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await deleteProjectTool.logAndExecute<void, DeleteProjectError>({
        requestId,
        authInfo,
        args: { projectId, confirm },
        callback: async () => {
          if (!confirm) {
            return new Err({
              type: 'confirmation-required',
              message: 'You must explicitly set confirm: true to delete this project',
            });
          }

          const isProjectAllowedResult = await resourceAccessChecker.isProjectAllowed({
            projectId,
            restApiArgs: { config, requestId, server, signal },
          });

          if (!isProjectAllowedResult.allowed) {
            return new Err({
              type: 'project-not-allowed',
              message: isProjectAllowedResult.message,
            });
          }

          await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:projects:delete'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              await restApi.projectsMethods.deleteProject({
                siteId: restApi.siteId,
                projectId,
              });
            },
          });

          return new Ok(undefined);
        },
        constrainSuccessResult: () => {
          return {
            type: 'success',
            result: 'Project deleted successfully.',
          };
        },
        getErrorText: (error: DeleteProjectError) => {
          switch (error.type) {
            case 'project-not-allowed':
              return error.message;
            case 'confirmation-required':
              return error.message;
          }
        },
      });
    },
  });

  return deleteProjectTool;
};
