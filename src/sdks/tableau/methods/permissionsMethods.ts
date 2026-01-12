import { Zodios } from '@zodios/core';

import { AxiosRequestConfig } from '../../../utils/axios.js';
import { permissionsApis } from '../apis/permissionsApi.js';
import { Credentials } from '../types/credentials.js';
import { Permissions, Capability, GranteeCapabilities } from '../types/permissions.js';
import AuthenticatedMethods from './authenticatedMethods.js';

/**
 * Permissions methods of the Tableau Server REST API
 *
 * @export
 * @class PermissionsMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm
 */
export default class PermissionsMethods extends AuthenticatedMethods<typeof permissionsApis> {
  constructor(baseUrl: string, creds: Credentials, axiosConfig: AxiosRequestConfig) {
    super(new Zodios(baseUrl, permissionsApis, { axiosConfig }), creds);
  }

  /**
   * Returns permissions for the specified project.
   *
   * Required scopes: `tableau:permissions:read`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#query_project_permissions
   */
  getProjectPermissions = async ({
    siteId,
    projectId,
  }: {
    siteId: string;
    projectId: string;
  }): Promise<Permissions> => {
    const response = await this._apiClient.getProjectPermissions({
      params: { siteId, projectId },
      ...this.authHeader,
    });
    return response.permissions;
  };

  /**
   * Returns permissions for the specified workbook.
   *
   * Required scopes: `tableau:permissions:read`
   *
   * @param siteId - The Tableau site ID
   * @param workbookId - The ID of the workbook
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#query_workbook_permissions
   */
  getWorkbookPermissions = async ({
    siteId,
    workbookId,
  }: {
    siteId: string;
    workbookId: string;
  }): Promise<Permissions> => {
    const response = await this._apiClient.getWorkbookPermissions({
      params: { siteId, workbookId },
      ...this.authHeader,
    });
    return response.permissions;
  };

  /**
   * Returns permissions for the specified datasource.
   *
   * Required scopes: `tableau:permissions:read`
   *
   * @param siteId - The Tableau site ID
   * @param datasourceId - The ID of the datasource
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#query_datasource_permissions
   */
  getDatasourcePermissions = async ({
    siteId,
    datasourceId,
  }: {
    siteId: string;
    datasourceId: string;
  }): Promise<Permissions> => {
    const response = await this._apiClient.getDatasourcePermissions({
      params: { siteId, datasourceId },
      ...this.authHeader,
    });
    return response.permissions;
  };

  /**
   * Returns permissions for the specified view.
   *
   * Required scopes: `tableau:permissions:read`
   *
   * @param siteId - The Tableau site ID
   * @param viewId - The ID of the view
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#query_view_permissions
   */
  getViewPermissions = async ({
    siteId,
    viewId,
  }: {
    siteId: string;
    viewId: string;
  }): Promise<Permissions> => {
    const response = await this._apiClient.getViewPermissions({
      params: { siteId, viewId },
      ...this.authHeader,
    });
    return response.permissions;
  };

  /**
   * Returns the default permissions for a specific resource type in a project.
   *
   * Required scopes: `tableau:permissions:read`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param resourceType - The resource type (workbooks, datasources, flows, etc.)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#query_default_permissions
   */
  getDefaultPermissions = async ({
    siteId,
    projectId,
    resourceType,
  }: {
    siteId: string;
    projectId: string;
    resourceType: string;
  }): Promise<Permissions> => {
    const response = await this._apiClient.getDefaultPermissions({
      params: { siteId, projectId, resourceType },
      ...this.authHeader,
    });
    return response.permissions;
  };

  /**
   * Adds permissions to the specified project.
   *
   * Required scopes: `tableau:permissions:update`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param granteeCapabilities - The permissions to add
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#add_project_permissions
   */
  addProjectPermissions = async ({
    siteId,
    projectId,
    granteeCapabilities,
  }: {
    siteId: string;
    projectId: string;
    granteeCapabilities: Array<{
      user?: { id: string };
      group?: { id: string };
      capabilities: { capability: Capability[] };
    }>;
  }): Promise<Permissions> => {
    const response = await this._apiClient.addProjectPermissions(
      {
        permissions: {
          granteeCapabilities: {
            granteeCapabilities,
          },
        },
      },
      { params: { siteId, projectId }, ...this.authHeader },
    );
    return response.permissions;
  };

  /**
   * Adds permissions to the specified workbook.
   *
   * Required scopes: `tableau:permissions:update`
   *
   * @param siteId - The Tableau site ID
   * @param workbookId - The ID of the workbook
   * @param granteeCapabilities - The permissions to add
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#add_workbook_permissions
   */
  addWorkbookPermissions = async ({
    siteId,
    workbookId,
    granteeCapabilities,
  }: {
    siteId: string;
    workbookId: string;
    granteeCapabilities: Array<{
      user?: { id: string };
      group?: { id: string };
      capabilities: { capability: Capability[] };
    }>;
  }): Promise<Permissions> => {
    const response = await this._apiClient.addWorkbookPermissions(
      {
        permissions: {
          granteeCapabilities: {
            granteeCapabilities,
          },
        },
      },
      { params: { siteId, workbookId }, ...this.authHeader },
    );
    return response.permissions;
  };

  /**
   * Adds permissions to the specified datasource.
   *
   * Required scopes: `tableau:permissions:update`
   *
   * @param siteId - The Tableau site ID
   * @param datasourceId - The ID of the datasource
   * @param granteeCapabilities - The permissions to add
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#add_datasource_permissions
   */
  addDatasourcePermissions = async ({
    siteId,
    datasourceId,
    granteeCapabilities,
  }: {
    siteId: string;
    datasourceId: string;
    granteeCapabilities: Array<{
      user?: { id: string };
      group?: { id: string };
      capabilities: { capability: Capability[] };
    }>;
  }): Promise<Permissions> => {
    const response = await this._apiClient.addDatasourcePermissions(
      {
        permissions: {
          granteeCapabilities: {
            granteeCapabilities,
          },
        },
      },
      { params: { siteId, datasourceId }, ...this.authHeader },
    );
    return response.permissions;
  };

  /**
   * Adds permissions to the specified view.
   *
   * Required scopes: `tableau:permissions:update`
   *
   * @param siteId - The Tableau site ID
   * @param viewId - The ID of the view
   * @param granteeCapabilities - The permissions to add
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#add_view_permissions
   */
  addViewPermissions = async ({
    siteId,
    viewId,
    granteeCapabilities,
  }: {
    siteId: string;
    viewId: string;
    granteeCapabilities: Array<{
      user?: { id: string };
      group?: { id: string };
      capabilities: { capability: Capability[] };
    }>;
  }): Promise<Permissions> => {
    const response = await this._apiClient.addViewPermissions(
      {
        permissions: {
          granteeCapabilities: {
            granteeCapabilities,
          },
        },
      },
      { params: { siteId, viewId }, ...this.authHeader },
    );
    return response.permissions;
  };

  /**
   * Updates the default permissions for a specific resource type in a project.
   *
   * Required scopes: `tableau:permissions:update`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param resourceType - The resource type (workbooks, datasources, flows, etc.)
   * @param granteeCapabilities - The permissions to set
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#add_default_permissions
   */
  updateDefaultPermissions = async ({
    siteId,
    projectId,
    resourceType,
    granteeCapabilities,
  }: {
    siteId: string;
    projectId: string;
    resourceType: string;
    granteeCapabilities: Array<{
      user?: { id: string };
      group?: { id: string };
      capabilities: { capability: Capability[] };
    }>;
  }): Promise<Permissions> => {
    const response = await this._apiClient.updateDefaultPermissions(
      {
        permissions: {
          granteeCapabilities: {
            granteeCapabilities,
          },
        },
      },
      { params: { siteId, projectId, resourceType }, ...this.authHeader },
    );
    return response.permissions;
  };

  /**
   * Deletes a specific permission from a project.
   *
   * Required scopes: `tableau:permissions:delete`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param granteeType - The type of grantee (users or groups)
   * @param granteeId - The ID of the user or group
   * @param capabilityName - The name of the capability
   * @param capabilityMode - The mode of the capability (Allow or Deny)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#delete_project_permission
   */
  deleteProjectPermission = async ({
    siteId,
    projectId,
    granteeType,
    granteeId,
    capabilityName,
    capabilityMode,
  }: {
    siteId: string;
    projectId: string;
    granteeType: string;
    granteeId: string;
    capabilityName: string;
    capabilityMode: string;
  }): Promise<void> => {
    await this._apiClient.deleteProjectPermission(undefined, {
      params: { siteId, projectId, granteeType, granteeId, capabilityName, capabilityMode },
      ...this.authHeader,
    });
  };

  /**
   * Deletes a specific permission from a workbook.
   *
   * Required scopes: `tableau:permissions:delete`
   *
   * @param siteId - The Tableau site ID
   * @param workbookId - The ID of the workbook
   * @param granteeType - The type of grantee (users or groups)
   * @param granteeId - The ID of the user or group
   * @param capabilityName - The name of the capability
   * @param capabilityMode - The mode of the capability (Allow or Deny)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#delete_workbook_permission
   */
  deleteWorkbookPermission = async ({
    siteId,
    workbookId,
    granteeType,
    granteeId,
    capabilityName,
    capabilityMode,
  }: {
    siteId: string;
    workbookId: string;
    granteeType: string;
    granteeId: string;
    capabilityName: string;
    capabilityMode: string;
  }): Promise<void> => {
    await this._apiClient.deleteWorkbookPermission(undefined, {
      params: { siteId, workbookId, granteeType, granteeId, capabilityName, capabilityMode },
      ...this.authHeader,
    });
  };

  /**
   * Deletes a specific permission from a datasource.
   *
   * Required scopes: `tableau:permissions:delete`
   *
   * @param siteId - The Tableau site ID
   * @param datasourceId - The ID of the datasource
   * @param granteeType - The type of grantee (users or groups)
   * @param granteeId - The ID of the user or group
   * @param capabilityName - The name of the capability
   * @param capabilityMode - The mode of the capability (Allow or Deny)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#delete_datasource_permission
   */
  deleteDatasourcePermission = async ({
    siteId,
    datasourceId,
    granteeType,
    granteeId,
    capabilityName,
    capabilityMode,
  }: {
    siteId: string;
    datasourceId: string;
    granteeType: string;
    granteeId: string;
    capabilityName: string;
    capabilityMode: string;
  }): Promise<void> => {
    await this._apiClient.deleteDatasourcePermission(undefined, {
      params: { siteId, datasourceId, granteeType, granteeId, capabilityName, capabilityMode },
      ...this.authHeader,
    });
  };

  /**
   * Deletes a specific permission from a view.
   *
   * Required scopes: `tableau:permissions:delete`
   *
   * @param siteId - The Tableau site ID
   * @param viewId - The ID of the view
   * @param granteeType - The type of grantee (users or groups)
   * @param granteeId - The ID of the user or group
   * @param capabilityName - The name of the capability
   * @param capabilityMode - The mode of the capability (Allow or Deny)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#delete_view_permission
   */
  deleteViewPermission = async ({
    siteId,
    viewId,
    granteeType,
    granteeId,
    capabilityName,
    capabilityMode,
  }: {
    siteId: string;
    viewId: string;
    granteeType: string;
    granteeId: string;
    capabilityName: string;
    capabilityMode: string;
  }): Promise<void> => {
    await this._apiClient.deleteViewPermission(undefined, {
      params: { siteId, viewId, granteeType, granteeId, capabilityName, capabilityMode },
      ...this.authHeader,
    });
  };

  /**
   * Deletes a specific default permission from a project.
   *
   * Required scopes: `tableau:permissions:delete`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param resourceType - The resource type
   * @param granteeType - The type of grantee (users or groups)
   * @param granteeId - The ID of the user or group
   * @param capabilityName - The name of the capability
   * @param capabilityMode - The mode of the capability (Allow or Deny)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm#delete_default_permission
   */
  deleteDefaultPermission = async ({
    siteId,
    projectId,
    resourceType,
    granteeType,
    granteeId,
    capabilityName,
    capabilityMode,
  }: {
    siteId: string;
    projectId: string;
    resourceType: string;
    granteeType: string;
    granteeId: string;
    capabilityName: string;
    capabilityMode: string;
  }): Promise<void> => {
    await this._apiClient.deleteDefaultPermission(undefined, {
      params: {
        siteId,
        projectId,
        resourceType,
        granteeType,
        granteeId,
        capabilityName,
        capabilityMode,
      },
      ...this.authHeader,
    });
  };
}
