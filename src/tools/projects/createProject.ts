import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Project } from '../../sdks/tableau/types/project.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  name: z.string().min(1),
  description: z.string().optional(),
  contentPermissions: z.enum(['LockedToProject', 'ManagedByOwner']).optional(),
  parentProjectId: z.string().optional(),
};

export const getCreateProjectTool = (server: Server): Tool<typeof paramsSchema> => {
  const createProjectTool = new Tool({
    server,
    name: 'create-project',
    description: `
  Creates a new project on the specified Tableau site. Projects are used to organize and manage content on Tableau Server/Cloud.

  **Parameters:**
  - \`name\` (required): The name of the new project
  - \`description\` (optional): A description of the project
  - \`contentPermissions\` (optional): Controls how permissions are managed
    - \`LockedToProject\`: Content inherits permissions from the project (recommended for strict governance)
    - \`ManagedByOwner\`: Content owners can manage permissions independently
  - \`parentProjectId\` (optional): LUID of parent project to create a nested project

  **Required Permissions:**
  - Tableau Server Administrator or Site Administrator role
  - This operation requires administrative privileges

  **Example Usage:**
  - Create a top-level project:
      name: "Finance Analytics"
      description: "Financial reporting and analysis"
      contentPermissions: "LockedToProject"
  - Create a nested project:
      name: "Q1 Reports"
      parentProjectId: "abc123-def456-ghi789"
  `,
    paramsSchema,
    annotations: {
      title: 'Create Project',
      readOnlyHint: false,
      openWorldHint: true,
    },
    callback: async (
      { name, description, contentPermissions, parentProjectId },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();

      return await createProjectTool.logAndExecute<Project, never>({
        requestId,
        authInfo,
        args: { name, description, contentPermissions, parentProjectId },
        callback: async () => {
          const project = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:projects:create'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const project = await restApi.projectsMethods.createProject({
                siteId: restApi.siteId,
                project: {
                  name,
                  description,
                  contentPermissions,
                  parentProjectId,
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
      });
    },
  });

  return createProjectTool;
};
