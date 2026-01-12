import { Zodios } from '@zodios/core';

import { AxiosRequestConfig } from '../../../utils/axios.js';
import { extractRefreshApis } from '../apis/extractRefreshApi.js';
import { Credentials } from '../types/credentials.js';
import {
  ExtractRefresh,
  ExtractRefreshTask,
  FrequencyDetails,
  Job,
  Schedule,
} from '../types/extractRefreshTask.js';
import { Pagination } from '../types/pagination.js';
import AuthenticatedMethods from './authenticatedMethods.js';

/**
 * Extract Refresh methods of the Tableau Server REST API
 *
 * @export
 * @class ExtractRefreshMethods
 * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm
 */
export default class ExtractRefreshMethods extends AuthenticatedMethods<typeof extractRefreshApis> {
  constructor(baseUrl: string, creds: Credentials, axiosConfig: AxiosRequestConfig) {
    super(new Zodios(baseUrl, extractRefreshApis, { axiosConfig }), creds);
  }

  /**
   * Lists extract refresh tasks for the site.
   *
   * Required scopes: `tableau:tasks:read`
   *
   * @param siteId - The Tableau site ID
   * @param pageSize - The number of items to return in one response
   * @param pageNumber - The offset for paging
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#list_extract_refresh_tasks1
   */
  listExtractRefreshTasks = async ({
    siteId,
    pageSize,
    pageNumber,
  }: {
    siteId: string;
    pageSize?: number;
    pageNumber?: number;
  }): Promise<{ pagination?: Pagination; tasks: ExtractRefreshTask[] }> => {
    const response = await this._apiClient.listExtractRefreshTasks({
      params: { siteId },
      queries: { pageSize, pageNumber },
      ...this.authHeader,
    });

    // Handle both array and single task responses
    const taskData = response.tasks?.task;
    let tasks: ExtractRefreshTask[] = [];
    if (taskData) {
      tasks = Array.isArray(taskData) ? taskData : [taskData];
    }

    return {
      pagination: response.pagination,
      tasks,
    };
  };

  /**
   * Gets details for a specific extract refresh task.
   *
   * Required scopes: `tableau:tasks:read`
   *
   * @param siteId - The Tableau site ID
   * @param taskId - The ID of the extract refresh task
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#get_extract_refresh_task1
   */
  getExtractRefreshTask = async ({
    siteId,
    taskId,
  }: {
    siteId: string;
    taskId: string;
  }): Promise<ExtractRefresh> => {
    const response = await this._apiClient.getExtractRefreshTask({
      params: { siteId, taskId },
      ...this.authHeader,
    });
    return response.task.extractRefresh;
  };

  /**
   * Creates an extract refresh task.
   *
   * Required scopes: `tableau:tasks:create`
   *
   * @param siteId - The Tableau site ID
   * @param type - The type of refresh (FullRefresh or IncrementalRefresh)
   * @param workbookId - The ID of the workbook (required if no datasourceId)
   * @param datasourceId - The ID of the datasource (required if no workbookId)
   * @param frequency - Schedule frequency (Hourly, Daily, Weekly, Monthly)
   * @param frequencyDetails - Detailed timing configuration
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#create_extract_refresh_task1
   */
  createExtractRefreshTask = async ({
    siteId,
    type,
    workbookId,
    datasourceId,
    frequency,
    frequencyDetails,
  }: {
    siteId: string;
    type: string;
    workbookId?: string;
    datasourceId?: string;
    frequency: string;
    frequencyDetails?: FrequencyDetails;
  }): Promise<{ extractRefresh: ExtractRefresh; schedule?: Schedule }> => {
    const response = await this._apiClient.createExtractRefreshTask(
      {
        extractRefresh: {
          type,
          ...(workbookId && { workbook: { id: workbookId } }),
          ...(datasourceId && { datasource: { id: datasourceId } }),
        },
        schedule: {
          frequency,
          ...(frequencyDetails && { frequencyDetails }),
        },
      },
      { params: { siteId }, ...this.authHeader },
    );
    return {
      extractRefresh: response.extractRefresh,
      schedule: response.schedule,
    };
  };

  /**
   * Updates an extract refresh task.
   *
   * Required scopes: `tableau:tasks:update`
   *
   * @param siteId - The Tableau site ID
   * @param taskId - The ID of the extract refresh task
   * @param type - The type of refresh (optional)
   * @param workbookId - The ID of the workbook (optional)
   * @param datasourceId - The ID of the datasource (optional)
   * @param frequency - Schedule frequency (optional)
   * @param frequencyDetails - Detailed timing configuration (optional)
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#update_cloud_extract_refresh_task
   */
  updateExtractRefreshTask = async ({
    siteId,
    taskId,
    type,
    workbookId,
    datasourceId,
    frequency,
    frequencyDetails,
  }: {
    siteId: string;
    taskId: string;
    type?: string;
    workbookId?: string;
    datasourceId?: string;
    frequency?: string;
    frequencyDetails?: FrequencyDetails;
  }): Promise<{ extractRefresh: ExtractRefresh; schedule?: Schedule }> => {
    const extractRefreshUpdate: Record<string, unknown> = {};
    if (type) extractRefreshUpdate.type = type;
    if (workbookId) extractRefreshUpdate.workbook = { id: workbookId };
    if (datasourceId) extractRefreshUpdate.datasource = { id: datasourceId };

    const scheduleUpdate: Record<string, unknown> = {};
    if (frequency) scheduleUpdate.frequency = frequency;
    if (frequencyDetails) scheduleUpdate.frequencyDetails = frequencyDetails;

    const response = await this._apiClient.updateExtractRefreshTask(
      {
        ...(Object.keys(extractRefreshUpdate).length > 0 && {
          extractRefresh: extractRefreshUpdate,
        }),
        ...(Object.keys(scheduleUpdate).length > 0 && { schedule: scheduleUpdate }),
      },
      { params: { siteId, taskId }, ...this.authHeader },
    );
    return {
      extractRefresh: response.extractRefresh,
      schedule: response.schedule,
    };
  };

  /**
   * Runs an extract refresh task immediately.
   *
   * Required scopes: `tableau:tasks:run`
   *
   * @param siteId - The Tableau site ID
   * @param taskId - The ID of the extract refresh task
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#run_extract_refresh_task
   */
  runExtractRefreshTask = async ({
    siteId,
    taskId,
  }: {
    siteId: string;
    taskId: string;
  }): Promise<Job> => {
    const response = await this._apiClient.runExtractRefreshTask(
      {},
      { params: { siteId, taskId }, ...this.authHeader },
    );
    return response.job;
  };

  /**
   * Deletes an extract refresh task.
   *
   * Required scopes: `tableau:tasks:delete`
   *
   * @param siteId - The Tableau site ID
   * @param taskId - The ID of the extract refresh task
   * @link https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm#delete_extract_refresh_task
   */
  deleteExtractRefreshTask = async ({
    siteId,
    taskId,
  }: {
    siteId: string;
    taskId: string;
  }): Promise<void> => {
    await this._apiClient.deleteExtractRefreshTask(undefined, {
      params: { siteId, taskId },
      ...this.authHeader,
    });
  };
}
