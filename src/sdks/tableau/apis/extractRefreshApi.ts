import { makeApi, makeEndpoint, ZodiosEndpointDefinitions } from '@zodios/core';
import { z } from 'zod';

import {
  extractRefreshSchema,
  extractRefreshTaskSchema,
  frequencyDetailsSchema,
  jobSchema,
  scheduleSchema,
} from '../types/extractRefreshTask.js';

// GET List Extract Refresh Tasks
const listExtractRefreshTasksEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/tasks/extractRefreshes',
  alias: 'listExtractRefreshTasks',
  description: 'Lists extract refresh tasks for the site.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'pageSize',
      type: 'Query',
      schema: z.number().optional(),
    },
    {
      name: 'pageNumber',
      type: 'Query',
      schema: z.number().optional(),
    },
  ],
  response: z.object({
    tasks: z
      .object({
        task: z.union([z.array(extractRefreshTaskSchema), extractRefreshTaskSchema]).optional(),
      })
      .optional(),
    pagination: z
      .object({
        pageNumber: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        totalAvailable: z.coerce.number().optional(),
      })
      .optional(),
  }),
});

// GET Extract Refresh Task
const getExtractRefreshTaskEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/tasks/extractRefreshes/:taskId',
  alias: 'getExtractRefreshTask',
  description: 'Gets details for a specific extract refresh task.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'taskId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.object({
    task: z.object({
      extractRefresh: extractRefreshSchema,
    }),
  }),
});

// POST Create Extract Refresh Task
const createExtractRefreshTaskEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/tasks/extractRefreshes',
  alias: 'createExtractRefreshTask',
  description: 'Creates an extract refresh task.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'body',
      type: 'Body',
      schema: z.object({
        extractRefresh: z.object({
          type: z.string(),
          workbook: z.object({ id: z.string() }).optional(),
          datasource: z.object({ id: z.string() }).optional(),
        }),
        schedule: z.object({
          frequency: z.string(),
          frequencyDetails: frequencyDetailsSchema.optional(),
        }),
      }),
    },
  ],
  response: z.object({
    extractRefresh: extractRefreshSchema,
    schedule: scheduleSchema.optional(),
  }),
});

// POST Update Extract Refresh Task
const updateExtractRefreshTaskEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/tasks/extractRefreshes/:taskId',
  alias: 'updateExtractRefreshTask',
  description: 'Updates an extract refresh task.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'taskId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'body',
      type: 'Body',
      schema: z.object({
        extractRefresh: z
          .object({
            type: z.string().optional(),
            workbook: z.object({ id: z.string() }).optional(),
            datasource: z.object({ id: z.string() }).optional(),
          })
          .optional(),
        schedule: z
          .object({
            frequency: z.string().optional(),
            frequencyDetails: frequencyDetailsSchema.optional(),
          })
          .optional(),
      }),
    },
  ],
  response: z.object({
    extractRefresh: extractRefreshSchema,
    schedule: scheduleSchema.optional(),
  }),
});

// POST Run Extract Refresh Task Now
const runExtractRefreshTaskEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/tasks/extractRefreshes/:taskId/runNow',
  alias: 'runExtractRefreshTask',
  description: 'Runs an extract refresh task immediately.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'taskId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'body',
      type: 'Body',
      schema: z.object({}),
    },
  ],
  response: z.object({
    job: jobSchema,
  }),
});

// DELETE Extract Refresh Task
const deleteExtractRefreshTaskEndpoint = makeEndpoint({
  method: 'delete',
  path: '/sites/:siteId/tasks/extractRefreshes/:taskId',
  alias: 'deleteExtractRefreshTask',
  description: 'Deletes an extract refresh task.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'taskId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.void(),
});

const extractRefreshApi = makeApi([
  listExtractRefreshTasksEndpoint,
  getExtractRefreshTaskEndpoint,
  createExtractRefreshTaskEndpoint,
  updateExtractRefreshTaskEndpoint,
  runExtractRefreshTaskEndpoint,
  deleteExtractRefreshTaskEndpoint,
]);

export const extractRefreshApis = [
  ...extractRefreshApi,
] as const satisfies ZodiosEndpointDefinitions;
