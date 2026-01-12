import { Zodios } from '@zodios/core';

import { AxiosRequestConfig } from '../../../utils/axios.js';
import { groupsApis } from '../apis/groupsApi.js';
import { Credentials } from '../types/credentials.js';
import { Group } from '../types/group.js';
import { Pagination } from '../types/pagination.js';
import { User } from '../types/user.js';
import AuthenticatedMethods from './authenticatedMethods.js';

/**
 * Groups methods of the Tableau Server REST API
 *
 * @export
 * @class GroupsMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm
 */
export default class GroupsMethods extends AuthenticatedMethods<typeof groupsApis> {
  constructor(baseUrl: string, creds: Credentials, axiosConfig: AxiosRequestConfig) {
    super(new Zodios(baseUrl, groupsApis, { axiosConfig }), creds);
  }

  /**
   * Returns a list of groups on the specified site.
   *
   * Required scopes: `tableau:groups:read`
   *
   * @param siteId - The Tableau site ID
   * @param filter - The filter string to filter groups by
   * @param pageSize - The number of items to return in one response
   * @param pageNumber - The offset for paging
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#query_groups
   */
  listGroups = async ({
    siteId,
    filter,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination: Pagination; groups: Group[] }> => {
    const response = await this._apiClient.listGroups({
      params: { siteId },
      queries: { filter, pageSize, pageNumber },
      ...this.authHeader,
    });
    return {
      pagination: response.pagination,
      groups: response.groups.group ?? [],
    };
  };

  /**
   * Creates a group on the specified site.
   *
   * Required scopes: `tableau:groups:create`
   *
   * @param siteId - The Tableau site ID
   * @param group - The group details
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#create_group
   */
  createGroup = async ({
    siteId,
    group,
  }: {
    siteId: string;
    group: {
      name: string;
      minimumSiteRole?: string;
    };
  }): Promise<Group> => {
    const groupData = {
      name: group.name,
      ...(group.minimumSiteRole !== undefined ? { minimumSiteRole: group.minimumSiteRole } : {}),
    };

    return (
      await this._apiClient.createGroup(
        { group: groupData },
        { params: { siteId }, ...this.authHeader },
      )
    ).group;
  };

  /**
   * Updates the specified group.
   *
   * Required scopes: `tableau:groups:update`
   *
   * @param siteId - The Tableau site ID
   * @param groupId - The ID of the group
   * @param group - The group details to update
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#update_group
   */
  updateGroup = async ({
    siteId,
    groupId,
    group,
  }: {
    siteId: string;
    groupId: string;
    group: {
      name?: string;
      minimumSiteRole?: string;
    };
  }): Promise<Group> => {
    const groupData = {
      ...(group.name !== undefined ? { name: group.name } : {}),
      ...(group.minimumSiteRole !== undefined ? { minimumSiteRole: group.minimumSiteRole } : {}),
    };

    return (
      await this._apiClient.updateGroup(
        { group: groupData },
        { params: { siteId, groupId }, ...this.authHeader },
      )
    ).group;
  };

  /**
   * Deletes the specified group.
   *
   * Required scopes: `tableau:groups:delete`
   *
   * @param siteId - The Tableau site ID
   * @param groupId - The ID of the group
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#delete_group
   */
  deleteGroup = async ({
    siteId,
    groupId,
  }: {
    siteId: string;
    groupId: string;
  }): Promise<void> => {
    await this._apiClient.deleteGroup(undefined, {
      params: { siteId, groupId },
      ...this.authHeader,
    });
  };

  /**
   * Returns a list of users in the specified group.
   *
   * Required scopes: `tableau:groups:read`
   *
   * @param siteId - The Tableau site ID
   * @param groupId - The ID of the group
   * @param pageSize - The number of items to return in one response
   * @param pageNumber - The offset for paging
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#get_users_in_group
   */
  listUsersInGroup = async ({
    siteId,
    groupId,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    groupId: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination: Pagination; users: User[] }> => {
    const response = await this._apiClient.listUsersInGroup({
      params: { siteId, groupId },
      queries: { pageSize, pageNumber },
      ...this.authHeader,
    });
    return {
      pagination: response.pagination,
      users: response.users.user ?? [],
    };
  };

  /**
   * Adds a user to the specified group.
   *
   * Required scopes: `tableau:groups:update`
   *
   * @param siteId - The Tableau site ID
   * @param groupId - The ID of the group
   * @param userId - The ID of the user to add
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#add_user_to_group
   */
  addUserToGroup = async ({
    siteId,
    groupId,
    userId,
  }: {
    siteId: string;
    groupId: string;
    userId: string;
  }): Promise<User> => {
    return (
      await this._apiClient.addUserToGroup(
        { user: { id: userId } },
        { params: { siteId, groupId }, ...this.authHeader },
      )
    ).user;
  };

  /**
   * Removes a user from the specified group.
   *
   * Required scopes: `tableau:groups:update`
   *
   * @param siteId - The Tableau site ID
   * @param groupId - The ID of the group
   * @param userId - The ID of the user to remove
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm#remove_user_from_group
   */
  removeUserFromGroup = async ({
    siteId,
    groupId,
    userId,
  }: {
    siteId: string;
    groupId: string;
    userId: string;
  }): Promise<void> => {
    await this._apiClient.removeUserFromGroup(undefined, {
      params: { siteId, groupId, userId },
      ...this.authHeader,
    });
  };
}
