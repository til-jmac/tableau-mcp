import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Err, Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Project } from '../../sdks/tableau/types/project.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { resourceAccessChecker } from '../resourceAccessChecker.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  projectId: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  contentPermissions: z.enum(['LockedToProject', 'ManagedByOwner']).optional(),
  parentProjectId: z.string().optional(),
  ownerId: z.string().optional(),
};

export type UpdateProjectError = {
  type: 'project-not-allowed';
  message: string;
};

export const getUpdateProjectTool = (server: Server): Tool<typeof paramsSchema> => {
  const updateProjectTool = new Tool({
    server,
    name: 'update-project',
    description: `
  Updates an existing project on the specified Tableau site. You can modify the project's name, description, permissions model, parent project (to move it), or owner.

  **Parameters:**
  - \`projectId\` (required): The LUID of the project to update
  - \`name\` (optional): New name for the project
  - \`description\` (optional): New description for the project
  - \`contentPermissions\` (optional): Controls how permissions are managed
    - \`LockedToProject\`: Content inherits permissions from the project
    - \`ManagedByOwner\`: Content owners can manage permissions independently
  - \`parentProjectId\` (optional): New parent project LUID (to move the project)
  - \`ownerId\` (optional): New owner user LUID

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role
  - This operation requires administrative privileges

  **Example Usage:**
  - Rename a project:
      projectId: "abc123-def456"
      name: "Finance Analytics 2024"
  - Move a project:
      projectId: "abc123-def456"
      parentProjectId: "xyz789-uvw012"
  - Change permissions model:
      projectId: "abc123-def456"
      contentPermissions: "LockedToProject"
  `,
    paramsSchema,
    annotations: {
      title: 'Update Project',
      readOnlyHint: false,
      openWorldHint: false,
    },
    callback: async (
      { projectId, name, description, contentPermissions, parentProjectId, ownerId },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await updateProjectTool.logAndExecute<Project, UpdateProjectError>({
        requestId,
        authInfo,
        args: { projectId, name, description, contentPermissions, parentProjectId, ownerId },
        callback: async () => {
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

          const project = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:projects:update'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const project = await restApi.projectsMethods.updateProject({
                siteId: restApi.siteId,
                projectId,
                project: {
                  name,
                  description,
                  contentPermissions,
                  parentProjectId,
                  ownerId,
                },
              });

              return project;
            },
          });

          return new Ok(project);
        },
        constrainSuccessResult: (project) => {
          return {
            type: 'success',
            result: project,
          };
        },
        getErrorText: (error: UpdateProjectError) => {
          switch (error.type) {
            case 'project-not-allowed':
              return error.message;
          }
        },
      });
    },
  });

  return updateProjectTool;
};
