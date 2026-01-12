import { makeApi, makeEndpoint, ZodiosEndpointDefinitions } from '@zodios/core';
import { z } from 'zod';

import { groupSchema } from '../types/group.js';
import { paginationSchema } from '../types/pagination.js';
import { userSchema } from '../types/user.js';
import { paginationParameters } from './paginationParameters.js';

const listGroupsEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/groups',
  alias: 'listGroups',
  description: 'Returns a list of groups on the specified site.',
  parameters: [
    ...paginationParameters,
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'filter',
      type: 'Query',
      schema: z.string().optional(),
      description: 'Filter string in the format field:operator:value',
    },
  ],
  response: z.object({
    pagination: paginationSchema,
    groups: z.object({
      group: z.optional(z.array(groupSchema)),
    }),
  }),
});

const createGroupEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/groups',
  alias: 'createGroup',
  description: 'Creates a group on the specified site.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'group',
      type: 'Body',
      schema: z.object({
        group: z.object({
          name: z.string(),
          minimumSiteRole: z.string().optional(),
        }),
      }),
    },
  ],
  response: z.object({
    group: groupSchema,
  }),
});

const updateGroupEndpoint = makeEndpoint({
  method: 'put',
  path: '/sites/:siteId/groups/:groupId',
  alias: 'updateGroup',
  description: 'Updates the specified group.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'groupId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'group',
      type: 'Body',
      schema: z.object({
        group: z.object({
          name: z.string().optional(),
          minimumSiteRole: z.string().optional(),
        }),
      }),
    },
  ],
  response: z.object({
    group: groupSchema,
  }),
});

const deleteGroupEndpoint = makeEndpoint({
  method: 'delete',
  path: '/sites/:siteId/groups/:groupId',
  alias: 'deleteGroup',
  description: 'Deletes the specified group.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'groupId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.void(),
});

const listUsersInGroupEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/groups/:groupId/users',
  alias: 'listUsersInGroup',
  description: 'Returns a list of users in the specified group.',
  parameters: [
    ...paginationParameters,
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'groupId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.object({
    pagination: paginationSchema,
    users: z.object({
      user: z.optional(z.array(userSchema)),
    }),
  }),
});

const addUserToGroupEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/groups/:groupId/users',
  alias: 'addUserToGroup',
  description: 'Adds a user to the specified group.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'groupId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'user',
      type: 'Body',
      schema: z.object({
        user: z.object({
          id: z.string(),
        }),
      }),
    },
  ],
  response: z.object({
    user: userSchema,
  }),
});

const removeUserFromGroupEndpoint = makeEndpoint({
  method: 'delete',
  path: '/sites/:siteId/groups/:groupId/users/:userId',
  alias: 'removeUserFromGroup',
  description: 'Removes a user from the specified group.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'groupId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'userId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.void(),
});

const groupsApi = makeApi([
  listGroupsEndpoint,
  createGroupEndpoint,
  updateGroupEndpoint,
  deleteGroupEndpoint,
  listUsersInGroupEndpoint,
  addUserToGroupEndpoint,
  removeUserFromGroupEndpoint,
]);

export const groupsApis = [...groupsApi] as const satisfies ZodiosEndpointDefinitions;
