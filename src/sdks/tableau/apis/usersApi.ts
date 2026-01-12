import { makeApi, makeEndpoint, ZodiosEndpointDefinitions } from '@zodios/core';
import { z } from 'zod';

import { groupSchema } from '../types/group.js';
import { paginationSchema } from '../types/pagination.js';
import { userSchema } from '../types/user.js';
import { paginationParameters } from './paginationParameters.js';

const listUsersEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/users',
  alias: 'listUsers',
  description: 'Returns a list of users on the specified site.',
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
    users: z.object({
      user: z.optional(z.array(userSchema)),
    }),
  }),
});

const getUserEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/users/:userId',
  alias: 'getUser',
  description: 'Returns information about the specified user.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'userId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.object({
    user: userSchema,
  }),
});

const createUserEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/users',
  alias: 'createUser',
  description: 'Adds a user to the specified site.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'user',
      type: 'Body',
      schema: z.object({
        user: z.object({
          name: z.string(),
          siteRole: z.string(),
          authSetting: z.string().optional(),
        }),
      }),
    },
  ],
  response: z.object({
    user: userSchema,
  }),
});

const updateUserEndpoint = makeEndpoint({
  method: 'put',
  path: '/sites/:siteId/users/:userId',
  alias: 'updateUser',
  description: 'Updates the specified user.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'userId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'user',
      type: 'Body',
      schema: z.object({
        user: z.object({
          fullName: z.string().optional(),
          email: z.string().optional(),
          siteRole: z.string().optional(),
          authSetting: z.string().optional(),
        }),
      }),
    },
  ],
  response: z.object({
    user: userSchema,
  }),
});

const deleteUserEndpoint = makeEndpoint({
  method: 'delete',
  path: '/sites/:siteId/users/:userId',
  alias: 'deleteUser',
  description: 'Removes a user from the specified site.',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'userId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'mapAssetsTo',
      type: 'Query',
      schema: z.string().optional(),
      description: 'User ID to reassign content ownership to',
    },
  ],
  response: z.void(),
});

const listGroupsForUserEndpoint = makeEndpoint({
  method: 'get',
  path: '/sites/:siteId/users/:userId/groups',
  alias: 'listGroupsForUser',
  description: 'Returns a list of groups that the specified user belongs to.',
  parameters: [
    ...paginationParameters,
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'userId',
      type: 'Path',
      schema: z.string(),
    },
  ],
  response: z.object({
    pagination: paginationSchema,
    groups: z.object({
      group: z.optional(z.array(groupSchema)),
    }),
  }),
});

const usersApi = makeApi([
  listUsersEndpoint,
  getUserEndpoint,
  createUserEndpoint,
  updateUserEndpoint,
  deleteUserEndpoint,
  listGroupsForUserEndpoint,
]);

export const usersApis = [...usersApi] as const satisfies ZodiosEndpointDefinitions;
