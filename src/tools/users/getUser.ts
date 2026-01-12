import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Ok } from 'ts-results-es';
import { z } from 'zod';

import { getConfig } from '../../config.js';
import { useRestApi } from '../../restApiInstance.js';
import { User } from '../../sdks/tableau/types/user.js';
import { Server } from '../../server.js';
import { getTableauAuthInfo } from '../../server/oauth/getTableauAuthInfo.js';
import { Tool } from '../tool.js';

const paramsSchema = {
  userId: z.string(),
};

export const getGetUserTool = (server: Server): Tool<typeof paramsSchema> => {
  const getUserTool = new Tool({
    server,
    name: 'get-user',
    description:
      'Retrieves information about the specified user, including their name, email, site role, and authentication settings. Use this tool when a user requests details about a specific Tableau user.',
    paramsSchema,
    annotations: {
      title: 'Get User',
      readOnlyHint: true,
      openWorldHint: false,
    },
    callback: async ({ userId }, { requestId, authInfo, signal }): Promise<CallToolResult> => {
      const config = getConfig();

      return await getUserTool.logAndExecute<User>({
        requestId,
        authInfo,
        args: { userId },
        callback: async () => {
          const user = await useRestApi({
            config,
            requestId,
            server,
            jwtScopes: ['tableau:content:read'],
            signal,
            authInfo: getTableauAuthInfo(authInfo),
            callback: async (restApi) => {
              return await restApi.usersMethods.getUser({
                siteId: restApi.siteId,
                userId,
              });
            },
          });

          return new Ok(user);
        },
        constrainSuccessResult: (user) => {
          return {
            type: 'success',
            result: user,
          };
        },
      });
    },
  });

  return getUserTool;
};
