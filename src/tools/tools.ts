import { getSearchContentTool } from './contentExploration/searchContent.js';
import { getCreateExtractRefreshTaskTool } from './extractRefresh/createExtractRefreshTask.js';
import { getDeleteExtractRefreshTaskTool } from './extractRefresh/deleteExtractRefreshTask.js';
import { getGetExtractRefreshTaskTool } from './extractRefresh/getExtractRefreshTask.js';
import { getListExtractRefreshTasksTool } from './extractRefresh/listExtractRefreshTasks.js';
import { getRunExtractRefreshTaskTool } from './extractRefresh/runExtractRefreshTask.js';
import { getUpdateExtractRefreshTaskTool } from './extractRefresh/updateExtractRefreshTask.js';
import { getGetDatasourceMetadataTool } from './getDatasourceMetadata/getDatasourceMetadata.js';
import { getAddUserToGroupTool } from './groups/addUserToGroup.js';
import { getCreateGroupTool } from './groups/createGroup.js';
import { getDeleteGroupTool } from './groups/deleteGroup.js';
import { getListGroupsTool } from './groups/listGroups.js';
import { getListUsersInGroupTool } from './groups/listUsersInGroup.js';
import { getRemoveUserFromGroupTool } from './groups/removeUserFromGroup.js';
import { getUpdateGroupTool } from './groups/updateGroup.js';
import { getListDatasourcesTool } from './listDatasources/listDatasources.js';
import { getAddPermissionsTool } from './permissions/addPermissions.js';
import { getDeleteDefaultPermissionTool } from './permissions/deleteDefaultPermission.js';
import { getDeletePermissionTool } from './permissions/deletePermission.js';
import { getListDatasourcePermissionsTool } from './permissions/listDatasourcePermissions.js';
import { getListDefaultPermissionsTool } from './permissions/listDefaultPermissions.js';
import { getListProjectPermissionsTool } from './permissions/listProjectPermissions.js';
import { getListViewPermissionsTool } from './permissions/listViewPermissions.js';
import { getListWorkbookPermissionsTool } from './permissions/listWorkbookPermissions.js';
import { getUpdateDefaultPermissionsTool } from './permissions/updateDefaultPermissions.js';
import { getCreateProjectTool } from './projects/createProject.js';
import { getDeleteProjectTool } from './projects/deleteProject.js';
import { getListProjectsTool } from './projects/listProjects.js';
import { getUpdateProjectTool } from './projects/updateProject.js';
import { getGeneratePulseInsightBriefTool } from './pulse/generateInsightBrief/generatePulseInsightBriefTool.js';
import { getGeneratePulseMetricValueInsightBundleTool } from './pulse/generateMetricValueInsightBundle/generatePulseMetricValueInsightBundleTool.js';
import { getListAllPulseMetricDefinitionsTool } from './pulse/listAllMetricDefinitions/listAllPulseMetricDefinitions.js';
import { getListPulseMetricDefinitionsFromDefinitionIdsTool } from './pulse/listMetricDefinitionsFromDefinitionIds/listPulseMetricDefinitionsFromDefinitionIds.js';
import { getListPulseMetricsFromMetricDefinitionIdTool } from './pulse/listMetricsFromMetricDefinitionId/listPulseMetricsFromMetricDefinitionId.js';
import { getListPulseMetricsFromMetricIdsTool } from './pulse/listMetricsFromMetricIds/listPulseMetricsFromMetricIds.js';
import { getListPulseMetricSubscriptionsTool } from './pulse/listMetricSubscriptions/listPulseMetricSubscriptions.js';
import { getQueryDatasourceTool } from './queryDatasource/queryDatasource.js';
import { getCreateUserTool } from './users/createUser.js';
import { getDeleteUserTool } from './users/deleteUser.js';
import { getGetUserTool } from './users/getUser.js';
import { getListGroupsForUserTool } from './users/listGroupsForUser.js';
import { getListUsersTool } from './users/listUsers.js';
import { getUpdateUserTool } from './users/updateUser.js';
import { getGetViewDataTool } from './views/getViewData.js';
import { getGetViewImageTool } from './views/getViewImage.js';
import { getListViewsTool } from './views/listViews.js';
import { getGetWorkbookTool } from './workbooks/getWorkbook.js';
import { getListWorkbooksTool } from './workbooks/listWorkbooks.js';

export const toolFactories = [
  getGetDatasourceMetadataTool,
  getListDatasourcesTool,
  getQueryDatasourceTool,
  getListProjectsTool,
  getCreateProjectTool,
  getUpdateProjectTool,
  getDeleteProjectTool,
  getListUsersTool,
  getGetUserTool,
  getListGroupsForUserTool,
  getCreateUserTool,
  getUpdateUserTool,
  getDeleteUserTool,
  getListGroupsTool,
  getCreateGroupTool,
  getUpdateGroupTool,
  getDeleteGroupTool,
  getListUsersInGroupTool,
  getAddUserToGroupTool,
  getRemoveUserFromGroupTool,
  getListProjectPermissionsTool,
  getListWorkbookPermissionsTool,
  getListDatasourcePermissionsTool,
  getListViewPermissionsTool,
  getListDefaultPermissionsTool,
  getAddPermissionsTool,
  getUpdateDefaultPermissionsTool,
  getDeletePermissionTool,
  getDeleteDefaultPermissionTool,
  getListExtractRefreshTasksTool,
  getGetExtractRefreshTaskTool,
  getCreateExtractRefreshTaskTool,
  getUpdateExtractRefreshTaskTool,
  getRunExtractRefreshTaskTool,
  getDeleteExtractRefreshTaskTool,
  getListAllPulseMetricDefinitionsTool,
  getListPulseMetricDefinitionsFromDefinitionIdsTool,
  getListPulseMetricsFromMetricDefinitionIdTool,
  getListPulseMetricsFromMetricIdsTool,
  getListPulseMetricSubscriptionsTool,
  getGeneratePulseMetricValueInsightBundleTool,
  getGeneratePulseInsightBriefTool,
  getGetWorkbookTool,
  getGetViewDataTool,
  getGetViewImageTool,
  getListWorkbooksTool,
  getListViewsTool,
  getSearchContentTool,
];
