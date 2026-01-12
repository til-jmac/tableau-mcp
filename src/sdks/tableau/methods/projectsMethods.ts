import { Zodios } from '@zodios/core';

import { AxiosRequestConfig } from '../../../utils/axios.js';
import { projectsApis } from '../apis/projectsApi.js';
import { Credentials } from '../types/credentials.js';
import { Pagination } from '../types/pagination.js';
import { Project } from '../types/project.js';
import AuthenticatedMethods from './authenticatedMethods.js';

/**
 * Projects methods of the Tableau Server REST API
 *
 * @export
 * @class ProjectsMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm
 */
export default class ProjectsMethods extends AuthenticatedMethods<typeof projectsApis> {
  constructor(baseUrl: string, creds: Credentials, axiosConfig: AxiosRequestConfig) {
    super(new Zodios(baseUrl, projectsApis, { axiosConfig }), creds);
  }

  /**
   * Returns a list of projects on the specified site.
   *
   * Required scopes: `tableau:content:read`
   *
   * @param siteId - The Tableau site ID
   * @param filter - The filter string to filter projects by
   * @param pageSize - The number of items to return in one response. The minimum is 1. The maximum is 1000. The default is 100.
   * @param pageNumber - The offset for paging. The default is 1.
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm#query_projects
   */
  listProjects = async ({
    siteId,
    filter,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    filter?: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination: Pagination; projects: Project[] }> => {
    const response = await this._apiClient.listProjects({
      params: { siteId },
      queries: { filter, pageSize, pageNumber },
      ...this.authHeader,
    });
    return {
      pagination: response.pagination,
      projects: response.projects.project ?? [],
    };
  };

  /**
   * Returns information about the specified project.
   * Note: Tableau REST API doesn't have a dedicated "Get Project" endpoint,
   * so we use Query Projects with a luid filter.
   *
   * Required scopes: `tableau:content:read`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID (LUID) of the project
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm#query_projects
   */
  getProject = async ({
    siteId,
    projectId,
  }: {
    siteId: string;
    projectId: string;
  }): Promise<Project> => {
    const response = await this._apiClient.listProjects({
      params: { siteId },
      queries: { filter: `luid:eq:${projectId}` },
      ...this.authHeader,
    });

    const projects = response.projects.project ?? [];
    if (projects.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    return projects[0];
  };

  /**
   * Creates a new project on the specified site.
   *
   * Required scopes: `tableau:projects:create`
   *
   * @param siteId - The Tableau site ID
   * @param project - The project details
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm#create_project
   */
  createProject = async ({
    siteId,
    project,
  }: {
    siteId: string;
    project: {
      name: string;
      description?: string;
      contentPermissions?: 'LockedToProject' | 'ManagedByOwner';
      parentProjectId?: string;
    };
  }): Promise<Project> => {
    const projectData = {
      name: project.name,
      ...(project.description !== undefined ? { description: project.description } : {}),
      ...(project.contentPermissions !== undefined
        ? { contentPermissions: project.contentPermissions }
        : {}),
      ...(project.parentProjectId !== undefined
        ? { parentProjectId: project.parentProjectId }
        : {}),
    };

    return (
      await this._apiClient.createProject(
        { project: projectData },
        { params: { siteId }, ...this.authHeader },
      )
    ).project;
  };

  /**
   * Updates the specified project.
   *
   * Required scopes: `tableau:projects:update`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @param project - The project details to update
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm#update_project
   */
  updateProject = async ({
    siteId,
    projectId,
    project,
  }: {
    siteId: string;
    projectId: string;
    project: {
      name?: string;
      description?: string;
      contentPermissions?: 'LockedToProject' | 'ManagedByOwner';
      parentProjectId?: string;
      ownerId?: string;
    };
  }): Promise<Project> => {
    const projectData = {
      ...(project.name !== undefined ? { name: project.name } : {}),
      ...(project.description !== undefined ? { description: project.description } : {}),
      ...(project.contentPermissions !== undefined
        ? { contentPermissions: project.contentPermissions }
        : {}),
      ...(project.parentProjectId !== undefined
        ? { parentProjectId: project.parentProjectId }
        : {}),
      ...(project.ownerId !== undefined ? { ownerId: project.ownerId } : {}),
    };

    return (
      await this._apiClient.updateProject(
        { project: projectData },
        { params: { siteId, projectId }, ...this.authHeader },
      )
    ).project;
  };

  /**
   * Deletes the specified project.
   *
   * Required scopes: `tableau:projects:delete`
   *
   * @param siteId - The Tableau site ID
   * @param projectId - The ID of the project
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm#delete_project
   */
  deleteProject = async ({
    siteId,
    projectId,
  }: {
    siteId: string;
    projectId: string;
  }): Promise<void> => {
    await this._apiClient.deleteProject(undefined, {
      params: { siteId, projectId },
      ...this.authHeader,
    });
  };
}
