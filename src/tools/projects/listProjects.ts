import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { BoundedContext, getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { Project } from '../../sdks/tableau/types/project.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { paginate } from '../../utils/paginate.js';
import { genericFilterDescription } from '../genericFilterDescription.js';
import { ConstrainedResult, Tool } from '../tool.js';
import { parseAndValidateProjectsFilterString } from './projectsFilterUtils.js';

const paramsSchema = {
  filter: z.string().optional(),
  pageSize: z.number().gt(0).optional(),
  limit: z.number().gt(0).optional(),
};

export const getListProjectsTool = (server: Server): Tool<typeof paramsSchema> => {
  const listProjectsTool = new Tool({
    server,
    name: 'list-projects',
    description: `
  Retrieves a list of projects from a specified Tableau site using the Tableau REST API. Projects are used to organize content on Tableau Server/Cloud. Supports optional filtering via field:operator:value expressions (e.g., name:eq:Finance) for precise project discovery. Use this tool when a user requests to list, search, or filter Tableau projects on a site.

  **Supported Filter Fields and Operators**
  | Field            | Operators            |
  |------------------|----------------------|
  | name             | eq, in               |
  | ownerDomain      | eq, in               |
  | ownerEmail       | eq, in               |
  | ownerName        | eq, in               |
  | parentProjectId  | eq, in               |
  | topLevelProject  | eq                   |
  | createdAt        | eq, gt, gte, lt, lte |
  | updatedAt        | eq, gt, gte, lt, lte |

  ${genericFilterDescription}

  **Example Usage:**
  - List all projects on a site
  - List projects with the name "Finance":
      filter: "name:eq:Finance"
  - List top-level projects (no parent):
      filter: "topLevelProject:eq:true"
  - List projects created after January 1, 2023:
      filter: "createdAt:gt:2023-01-01T00:00:00Z"
  - List projects owned by a specific user:
      filter: "ownerName:eq:John Doe"
  - List child projects of a specific parent:
      filter: "parentProjectId:eq:abc123-def456-ghi789"
  `,
    paramsSchema,
    annotations: {
      title: 'List Projects',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async (
      { filter, pageSize, limit },
      { requestId, authInfo, signal },
    ): Promise<CallToolResult> => {
      const config = getConfig();
      const validatedFilter = filter ? parseAndValidateProjectsFilterString(filter) : undefined;
      return await listProjectsTool.logAndExecute({
        requestId,
        authInfo,
        args: { filter, pageSize, limit },
        callback: async () => {
          const projects = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              const projects = await paginate({
                pageConfig: {
                  pageSize,
                  limit: config.maxResultLimit
                    ? Math.min(config.maxResultLimit, limit ?? Number.MAX_SAFE_INTEGER)
                    : limit,
                },
                getDataFn: async (pageConfig) => {
                  const { pagination, projects: data } = await restApi.projectsMethods.listProjects({
                    siteId: restApi.siteId,
                    filter: validatedFilter,
                    pageSize: pageConfig.pageSize,
                    pageNumber: pageConfig.pageNumber,
                  });

                  return { pagination, data };
                },
              });

              return projects;
            },
          });

          return new Ok(projects);
        },
        constrainSuccessResult: (projects) =>
          constrainProjects({ projects, boundedContext: config.boundedContext }),
      });
    },
  });

  return listProjectsTool;
};

export function constrainProjects({
  projects,
  boundedContext,
}: {
  projects: Array<Project>;
  boundedContext: BoundedContext;
}): ConstrainedResult<Array<Project>> {
  if (projects.length === 0) {
    return {
      type: 'empty',
      message:
        'No projects were found. Either none exist or you do not have permission to view them.',
    };
  }

  const { projectIds } = boundedContext;
  if (projectIds) {
    projects = projects.filter((project) => projectIds.has(project.id));
  }

  if (projects.length === 0) {
    return {
      type: 'empty',
      message: [
        'The set of allowed projects that can be accessed is limited by the server configuration.',
        'While projects were found, they were all filtered out by the server configuration.',
      ].join(' '),
    };
  }

  return {
    type: 'success',
    result: projects,
  };
}
