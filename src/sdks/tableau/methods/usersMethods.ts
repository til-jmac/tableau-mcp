import { Zodios } from '@zodios/core';

import { AxiosRequestConfig } from '../../../utils/axios.js';
import { usersApis } from '../apis/usersApi.js';
import { Credentials } from '../types/credentials.js';
import { Group } from '../types/group.js';
import { Pagination } from '../types/pagination.js';
import { User } from '../types/user.js';
import AuthenticatedMethods from './authenticatedMethods.js';

/**
 * Users methods of the Tableau Server REST API
 *
 * @export
 * @class UsersMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm
 */
export default class UsersMethods extends AuthenticatedMethods<typeof usersApis> {
  constructor(baseUrl: string, creds: Credentials, axiosConfig: AxiosRequestConfig) {
    super(new Zodios(baseUrl, usersApis, { axiosConfig }), creds);
  }

  /**
   * Returns a list of users on the specified site.
   *
   * Required scopes: `tableau:users:read`
   *
   * @param siteId - The Tableau site ID
   * @param filter - The filter string to filter users by
   * @param pageSize - The number of items to return in one response
   * @param pageNumber - The offset for paging
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#get_users_on_site
   */
  listUsers = async ({
    siteId,
    filter,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination: Pagination; users: User[] }> => {
    const response = await this._apiClient.listUsers({
      params: { siteId },
      queries: { filter, pageSize, pageNumber },
      ...this.authHeader,
    });
    return {
      pagination: response.pagination,
      users: response.users.user ?? [],
    };
  };

  /**
   * Returns information about the specified user.
   *
   * Required scopes: `tableau:users:read`
   *
   * @param siteId - The Tableau site ID
   * @param userId - The ID of the user
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#query_user_on_site
   */
  getUser = async ({
    siteId,
    userId,
  }: {
    siteId: string;
    userId: string;
  }): Promise<User> => {
    return (
      await this._apiClient.getUser({
        params: { siteId, userId },
        ...this.authHeader,
      })
    ).user;
  };

  /**
   * Adds a user to the specified site.
   *
   * Required scopes: `tableau:users:create`
   *
   * @param siteId - The Tableau site ID
   * @param user - The user details
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_site
   */
  createUser = async ({
    siteId,
    user,
  }: {
    siteId: string;
    user: {
      name: string;
      siteRole: string;
      authSetting?: string;
    };
  }): Promise<User> => {
    const userData = {
      name: user.name,
      siteRole: user.siteRole,
      ...(user.authSetting !== undefined ? { authSetting: user.authSetting } : {}),
    };

    return (
      await this._apiClient.createUser(
        { user: userData },
        { params: { siteId }, ...this.authHeader },
      )
    ).user;
  };

  /**
   * Updates the specified user.
   *
   * Required scopes: `tableau:users:update`
   *
   * @param siteId - The Tableau site ID
   * @param userId - The ID of the user
   * @param user - The user details to update
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#update_user
   */
  updateUser = async ({
    siteId,
    userId,
    user,
  }: {
    siteId: string;
    userId: string;
    user: {
      fullName?: string;
      email?: string;
      siteRole?: string;
      authSetting?: string;
    };
  }): Promise<User> => {
    const userData = {
      ...(user.fullName !== undefined ? { fullName: user.fullName } : {}),
      ...(user.email !== undefined ? { email: user.email } : {}),
      ...(user.siteRole !== undefined ? { siteRole: user.siteRole } : {}),
      ...(user.authSetting !== undefined ? { authSetting: user.authSetting } : {}),
    };

    return (
      await this._apiClient.updateUser(
        { user: userData },
        { params: { siteId, userId }, ...this.authHeader },
      )
    ).user;
  };

  /**
   * Removes a user from the specified site.
   *
   * Required scopes: `tableau:users:delete`
   *
   * @param siteId - The Tableau site ID
   * @param userId - The ID of the user
   * @param mapAssetsTo - Optional user ID to reassign content ownership to
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#remove_user_from_site
   */
  deleteUser = async ({
    siteId,
    userId,
    mapAssetsTo,
  }: {
    siteId: string;
    userId: string;
    mapAssetsTo?: string;
  }): Promise<void> => {
    await this._apiClient.deleteUser(undefined, {
      params: { siteId, userId },
      queries: { mapAssetsTo },
      ...this.authHeader,
    });
  };

  /**
   * Returns a list of groups that the specified user belongs to.
   *
   * Required scopes: `tableau:groups:read`
   *
   * @param siteId - The Tableau site ID
   * @param userId - The ID of the user
   * @param pageSize - The number of items to return in one response
   * @param pageNumber - The offset for paging
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#get_groups_for_a_user
   */
  listGroupsForUser = async ({
    siteId,
    userId,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    userId: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination: Pagination; groups: Group[] }> => {
    const response = await this._apiClient.listGroupsForUser({
      params: { siteId, userId },
      queries: { pageSize, pageNumber },
      ...this.authHeader,
    });
    return {
      pagination: response.pagination,
      groups: response.groups.group ?? [],
    };
  };
}
