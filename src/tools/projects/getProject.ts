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
};

export type GetProjectError = {
  type: 'project-not-allowed';
  message: string;
};

export const getGetProjectTool = (server: Server): Tool<typeof paramsSchema> => {
  const getProjectTool = new Tool({
    server,
    name: 'get-project',
    description:
      'Retrieves information about the specified project, including its name, description, permissions settings, owner, and timestamps. Use this tool when a user requests details about a specific Tableau project.',
    paramsSchema,
    annotations: {
      title: 'Get Project',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ projectId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await getProjectTool.logAndExecute<Project, GetProjectError>({
        requestId,
        authInfo,
        args: { projectId },
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

          return new Ok(
            await useRestApi({
              config,
              requestId,
              server,
              jwtScopes: ['tableau:content:read'],
              signal,
              authInfo: getTableauAuthInfo(authInfo),
              callback: async (restApi) => {
                // If we already have the project from the access check, use it
                const project =
                  isProjectAllowedResult.content ??
                  (await restApi.projectsMethods.getProject({
                    projectId,
                    siteId: restApi.siteId,
                  }));

                return project;
              },
            }),
          );
        },
        constrainSuccessResult: (project) => {
          return {
            type: 'success',
            result: project,
          };
        },
        getErrorText: (error: GetProjectError) => {
          switch (error.type) {
            case 'project-not-allowed':
              return error.message;
          }
        },
      });
    },
  });

  return getProjectTool;
};
