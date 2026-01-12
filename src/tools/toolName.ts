export const toolNames = [
  'list-datasources',
  'list-workbooks',
  'list-views',
  'query-datasource',
  'get-datasource-metadata',
  'get-workbook',
  'get-view-data',
  'get-view-image',
  'list-projects',
  'create-project',
  'update-project',
  'delete-project',
  'list-users',
  'get-user',
  'list-groups-for-user',
  'create-user',
  'update-user',
  'delete-user',
  'list-groups',
  'create-group',
  'update-group',
  'delete-group',
  'list-users-in-group',
  'add-user-to-group',
  'remove-user-from-group',
  'list-project-permissions',
  'list-workbook-permissions',
  'list-datasource-permissions',
  'list-view-permissions',
  'list-default-permissions',
  'add-permissions',
  'update-default-permissions',
  'delete-permission',
  'list-all-pulse-metric-definitions',
  'list-pulse-metric-definitions-from-definition-ids',
  'list-pulse-metrics-from-metric-definition-id',
  'list-pulse-metrics-from-metric-ids',
  'list-pulse-metric-subscriptions',
  'generate-pulse-metric-value-insight-bundle',
  'generate-pulse-insight-brief',
  'search-content',
] as const;
export type ToolName = (typeof toolNames)[number];

export const toolGroupNames = [
  'datasource',
  'workbook',
  'view',
  'project',
  'user',
  'group',
  'permissions',
  'pulse',
  'content-exploration',
] as const;
export type ToolGroupName = (typeof toolGroupNames)[number];

export const toolGroups = {
  datasource: ['list-datasources', 'get-datasource-metadata', 'query-datasource'],
  workbook: ['list-workbooks', 'get-workbook'],
  view: ['list-views', 'get-view-data', 'get-view-image'],
  project: ['list-projects', 'create-project', 'update-project', 'delete-project'],
  user: [
    'list-users',
    'get-user',
    'list-groups-for-user',
    'create-user',
    'update-user',
    'delete-user',
  ],
  group: [
    'list-groups',
    'create-group',
    'update-group',
    'delete-group',
    'list-users-in-group',
    'add-user-to-group',
    'remove-user-from-group',
  ],
  permissions: [
    'list-project-permissions',
    'list-workbook-permissions',
    'list-datasource-permissions',
    'list-view-permissions',
    'list-default-permissions',
    'add-permissions',
    'update-default-permissions',
    'delete-permission',
  ],
  pulse: [
    'list-all-pulse-metric-definitions',
    'list-pulse-metric-definitions-from-definition-ids',
    'list-pulse-metrics-from-metric-definition-id',
    'list-pulse-metrics-from-metric-ids',
    'list-pulse-metric-subscriptions',
    'generate-pulse-metric-value-insight-bundle',
    'generate-pulse-insight-brief',
  ],
  'content-exploration': ['search-content'],
} as const satisfies Record<ToolGroupName, Array<ToolName>>;

export function isToolName(value: unknown): value is ToolName {
  return !!toolNames.find((name) => name === value);
}

export function isToolGroupName(value: unknown): value is ToolGroupName {
  return !!toolGroupNames.find((name) => name === value);
}
