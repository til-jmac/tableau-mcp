# Implementation Plan: Tableau Server Administration Tools

## Overview

Add comprehensive server administration tools to the Tableau MCP server to support:
- **Projects Management** - CRUD operations for projects
- **Users & Groups Management** - CRUD operations for users and groups
- **Permissions Management** - CRUD operations for permissions across resources
- **Extract Refresh Management** - Manage and schedule extract refresh tasks

**Target Users:** Tableau Server Administrators

---

## Progress Tracking

### Session 1: 2026-01-09

#### Completed Steps
- ✅ **Upstream Sync**: Merged upstream/main (v1.12.4 → v1.13.10)
  - Resolved merge conflict in .gitignore
  - Successfully merged 15 commits
  - Commit: 6059c49
- ✅ **Dependencies**: Installed new dependencies (axios-retry, ssrfcheck)
- ✅ **Build Verification**: Build successful (build/index.js: 1.5mb)
- ✅ **Test Verification**: All 791 tests passed
- ✅ **Phase 1 SDK Foundation**: Complete
  - Enhanced `/src/sdks/tableau/types/project.ts` with full schema
  - Created `/src/sdks/tableau/apis/projectsApi.ts` with 5 endpoints
  - Created `/src/sdks/tableau/methods/projectsMethods.ts` with 5 methods
  - Integrated projectsMethods into RestApi class
  - Created `/src/tools/projects/projectsFilterUtils.ts` with 8 filter fields
  - Enhanced `/src/tools/resourceAccessChecker.ts` with `isProjectAllowed()` method

- ✅ **Phase 1: Projects Tools Implementation**: Complete
  - Created `/src/tools/projects/listProjects.ts` (read operation with filters & pagination)
  - Created `/src/tools/projects/getProject.ts` (read operation with bounded context)
  - Created `/src/tools/projects/createProject.ts` (admin-only write operation)
  - Created `/src/tools/projects/updateProject.ts` (admin-only write operation)
  - Created `/src/tools/projects/deleteProject.ts` (destructive operation with confirmation)
  - Registered all 5 tools in `toolName.ts` and `tools.ts`
  - Added 'project' tool group to tool groups
- ✅ **Build & Test Verification**: All systems operational
  - Build successful: 1.5mb bundle
  - All 791 tests passing

#### Phase 1 Summary
**Projects Management Tools (5 tools) - COMPLETE**
- ✅ SDK layer (types, APIs, methods)
- ✅ Filter utilities (8 filter fields)
- ✅ Resource access checking
- ✅ All 5 tools implemented (list, get, create, update, delete)
- ✅ Tool registration
- ✅ Build verification
- ✅ Test verification

#### Testing Status
- ✅ **Manual Testing**: Complete
  - Local HTTP server with debug logging
  - MCP Inspector successfully connected
  - list-projects: ✅ Working (retrieved projects successfully)
  - create-project: ✅ Working (successfully created test projects)
  - Schema fix: owner.name made optional (API returns minimal user info)

#### Zodios POST/PUT Pattern Discovery
- ⚠️ **Challenge**: First POST/PUT implementation - no existing reference pattern
- 🔍 **Root Cause**: Incorrect Body parameter structure and method call pattern
- ✅ **Solution**:
  - API schema must include top-level wrapper: `z.object({ project: z.object({...}) })`
  - Method call uses two arguments: `apiClient.method(bodyData, configObject)`
  - Filter undefined values using spread operator
- 📝 **Documentation**: Created `ZODIOS-POST-PUT-PATTERN.md` for future phases
- 📝 **Process**: Created `RESTART-PROCEDURE.md` for efficient development workflow

#### Commits
- ✅ `8d4ca07` - Add Phase 1: Projects Management Tools (5 tools)
- ✅ `0640dde` - docs: Add Projects Management tools to README
- ✅ `2cc8140` - fix: Correct Zodios Body parameter pattern for POST/PUT requests

#### Notes
- Upstream brought in: Unified Access Tokens, configurable timeouts, CIMD support, queryDatasource improvements
- Node version: Running v20.19.6 (requires >=22.7.5) - build/tests work despite warning
- Remember: No Claude/Anthropic references in commit messages

---

### Session 2: 2026-01-12

#### Completed Steps
- ✅ **Manual Testing**: Completed testing of remaining project tools
  - list-projects: ✅ Working (tested in Session 1)
  - create-project: ✅ Working (tested in Session 1)
  - update-project: ✅ Working (after Zodios pattern fix)
  - delete-project: ✅ Working (after Zodios DELETE pattern fix)

#### Critical Discovery: Tableau REST API Limitations
- ⚠️ **No "Get Project" Endpoint**: Tableau REST API does not have a dedicated endpoint to retrieve a single project by ID
  - Only "Query Projects" (list) endpoint exists
  - Unlike datasources/workbooks which have both list and get endpoints
  - The `luid` filter field is NOT supported for projects (only: name, ownerDomain, ownerEmail, ownerName, parentProjectId, topLevelProject, createdAt, updatedAt)

#### Resolution: Removed get-project Tool
- ❌ Removed `/src/tools/projects/getProject.ts`
- ❌ Removed `getProjectEndpoint` from `projectsApi.ts`
- ✅ Updated `toolName.ts` - removed 'get-project' from toolNames and project group
- ✅ Updated `tools.ts` - removed getGetProjectTool import and registration
- ✅ Simplified `resourceAccessChecker.isProjectAllowed()` - no longer makes API calls, just checks bounded context set
- **Rationale**: `list-projects` with filters achieves the same result; no value in a separate get tool

#### Zodios DELETE Pattern Discovery
- ⚠️ **Challenge**: DELETE request returning 401, path params not substituted (URL showed `/sites/:siteId/projects/:projectId`)
- 🔍 **Root Cause**: Single-argument call pattern doesn't work for DELETE with path params
- ✅ **Solution**: Use two-argument pattern with `undefined` as first argument:
  ```typescript
  // WRONG - params not substituted
  await this._apiClient.deleteProject({
    params: { siteId, projectId },
    ...this.authHeader,
  });

  // CORRECT - params properly substituted
  await this._apiClient.deleteProject(undefined, {
    params: { siteId, projectId },
    ...this.authHeader,
  });
  ```
- 📝 **Documentation**: Updated `ZODIOS-POST-PUT-PATTERN.md` with DELETE pattern

#### Phase 1 Final Summary
**Projects Management Tools (4 tools) - COMPLETE**
- ✅ list-projects - List/filter projects
- ✅ create-project - Create new projects (admin-only)
- ✅ update-project - Update project properties (admin-only)
- ✅ delete-project - Delete projects with confirmation (admin-only)
- ❌ get-project - Removed (Tableau API limitation)

#### Development Workflow Improvement
- ✅ Created `/scripts/dev-restart.sh` for quick rebuild/restart cycle
- Reduces context usage by offloading rebuild to separate terminal

---

### Session 3: 2026-01-12

#### Phase 2: Users & Groups Management - COMPLETE

**SDK Layer Created:**
- Enhanced `/src/sdks/tableau/types/user.ts` - Full user schema
- Created `/src/sdks/tableau/types/group.ts` - Group schema with domain support
- Created `/src/sdks/tableau/apis/usersApi.ts` - 6 endpoints
- Created `/src/sdks/tableau/apis/groupsApi.ts` - 7 endpoints
- Created `/src/sdks/tableau/methods/usersMethods.ts` - 6 methods
- Created `/src/sdks/tableau/methods/groupsMethods.ts` - 7 methods
- Updated `/src/sdks/tableau/restApi.ts` - Integrated new methods

**User Tools (6):**
- ✅ list-users - List/filter users with pagination
- ✅ get-user - Get specific user by ID
- ✅ list-groups-for-user - List groups a user belongs to
- ✅ create-user - Create new user (admin-only)
- ✅ update-user - Update user properties (admin-only)
- ✅ delete-user - Delete user with confirmation (admin-only)

**Group Tools (7):**
- ✅ list-groups - List/filter groups with pagination
- ✅ create-group - Create new group (admin-only)
- ✅ update-group - Update group properties (admin-only)
- ✅ delete-group - Delete group with confirmation (admin-only)
- ✅ list-users-in-group - List users in a specific group
- ✅ add-user-to-group - Add user to group (admin-only)
- ✅ remove-user-from-group - Remove user from group (admin-only)
- ❌ get-group - Not implemented (Tableau API limitation, same as projects)

**Filter Utilities:**
- Created `/src/tools/users/usersFilterUtils.ts` - 4 filter fields
- Created `/src/tools/groups/groupsFilterUtils.ts` - 4 filter fields

**Registration:**
- Updated `/src/tools/toolName.ts` - 13 new tool names, 'user' and 'group' groups
- Updated `/src/tools/tools.ts` - 13 new factory imports

**Build & Test:** All 791 tests pass, build successful

#### Code Review Findings (For Later)

| Priority | Issue | Location |
|----------|-------|----------|
| MEDIUM | JWT scope inconsistency - read ops use `tableau:content:read` but docs specify `tableau:users:read`/`tableau:groups:read` | All list/get tools |
| LOW | Redundant runtime confirmation check (Zod already validates) | deleteUser.ts, deleteGroup.ts |
| LOW | Inconsistent constrainUsers export | listUsersInGroup.ts vs listUsers.ts |

#### Architecture Review Findings (For Later)

**Strengths:**
- Clean 3-layer separation (APIs -> Methods -> Tools)
- Consistent pattern application from Phase 1
- Strong type safety with Zod + TypeScript
- Good dependency inversion via `useRestApi` pattern
- Proper destructive operation guards

**Risks/Improvements:**

| Priority | Issue | Recommendation |
|----------|-------|----------------|
| HIGH | JWT scopes for write ops not in `JwtScopes` type | Add new scopes to `/src/restApiInstance.ts` |
| MODERATE | Duplicated filter utility pattern | Consider factory approach |
| MODERATE | No bounded context for users/groups | Document as intentional or add support |
| LOW | Pagination limit logic duplicated | Extract to shared utility |
| LOW | siteRole accepts any string | Consider `z.enum()` validation |
| LOW | No unit tests for Phase 2 tools | Add test coverage |

**Scalability:** Architecture will scale well for Phase 3 (Permissions) and Phase 4 (Extract Refresh).

#### Next Steps
- ⏭️ **Phase 3**: Permissions Management Tools (8 tools)
- ⏭️ **Phase 4**: Extract Refresh Management Tools (6 tools)

---

## Prerequisites: Upstream Sync

**CRITICAL FIRST STEP:** Merge latest upstream changes before starting implementation.

```bash
# Current state: fork is at v1.12.4, upstream is at v1.13.10 (15 commits ahead)
git fetch upstream
git merge upstream/main
# Resolve any conflicts
# Test build: npm run build
# Run tests: npm test
```

**Key upstream changes to be aware of:**
- Unified Access Token support
- Configurable timeouts for REST APIs
- CIMD support for client registration
- queryDatasource tool improvements
- E2E test infrastructure changes

---

## Implementation Architecture

### Tool Organization Pattern

Following the existing codebase pattern, each tool requires:

1. **SDK Layer** (`/src/sdks/tableau/`)
   - API endpoint definitions (Zodios schemas) in `/apis/`
   - Method wrappers in `/methods/`
   - Type schemas (Zod) in `/types/`

2. **Tool Implementation** (`/src/tools/{category}/`)
   - Tool factory function (e.g., `getListProjectsTool()`)
   - Unit tests
   - Filter utilities (for list operations)

3. **Registration**
   - Add tool name to `/src/tools/toolName.ts`
   - Add factory to `/src/tools/tools.ts`
   - Update `/src/tools/resourceAccessChecker.ts` for bounded context

### Core Implementation Principles

- **Follow existing patterns**: Reference `/src/tools/listDatasources/` as template
- **Use `useRestApi()`**: All API calls must use this wrapper with appropriate JWT scopes
- **Validate inputs**: Use Zod schemas in `paramsSchema` and custom `argsValidator` functions
- **Handle errors**: Use `ts-results-es` `Ok/Err` pattern consistently
- **Check permissions**: Admin-only tools must validate privileges early
- **Bounded context**: Filter results and validate access per configuration
- **Safety first**: Destructive operations require `confirm: true` parameter

---

## Implementation Phases

### Phase 1: Projects Management Tools

**Priority Order:** Read → Create/Update → Delete

#### 1.1 SDK Foundation

**Files to create:**
- `/src/sdks/tableau/types/project.ts` - Enhance existing schema
- `/src/sdks/tableau/apis/projectsApi.ts` - Zodios API definitions
- `/src/sdks/tableau/methods/projectsMethods.ts` - Method wrappers

**Project Schema:**
```typescript
export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  contentPermissions: z.enum(['LockedToProject', 'ManagedByOwner']).optional(),
  parentProjectId: z.string().optional(),
  owner: userSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  controllingPermissionsProjectId: z.string().optional(),
});
```

**API Endpoints:**
- `GET /api/3.24/sites/:siteId/projects` - List projects
- `GET /api/3.24/sites/:siteId/projects/:projectId` - Get project
- `POST /api/3.24/sites/:siteId/projects` - Create project
- `PUT /api/3.24/sites/:siteId/projects/:projectId` - Update project
- `DELETE /api/3.24/sites/:siteId/projects/:projectId` - Delete project

**JWT Scopes Needed:**
- `tableau:content:read` (list, get)
- `tableau:projects:create` (create)
- `tableau:projects:update` (update)
- `tableau:projects:delete` (delete)

#### 1.2 Tools to Implement

**Read Operations (Priority 1):**

1. **`list-projects`** - `/src/tools/projects/listProjects.ts`
   - Parameters: `filter`, `pageSize`, `pageNumber`, `limit`
   - Filter fields: name, ownerDomain, ownerEmail, ownerName, parentProjectId, topLevelProject, createdAt, updatedAt
   - Create `/src/tools/projects/projectsFilterUtils.ts`
   - Use existing `paginate()` utility
   - Apply bounded context filtering

2. **`get-project`** - `/src/tools/projects/getProject.ts`
   - Parameters: `projectId` (required)
   - Validate bounded context access

**Create/Update Operations (Priority 2):**

3. **`create-project`** - `/src/tools/projects/createProject.ts`
   - Parameters: `name` (required), `description`, `contentPermissions`, `parentProjectId`, `publishSamples`
   - Annotations: `readOnlyHint: false`, `openWorldHint: true`
   - Admin-only: Validate user privileges

4. **`update-project`** - `/src/tools/projects/updateProject.ts`
   - Parameters: `projectId` (required), `name`, `description`, `contentPermissions`, `parentProjectId`, `ownerId`
   - Annotations: `readOnlyHint: false`, `openWorldHint: false`
   - Admin-only + bounded context validation

**Delete Operations (Priority 3):**

5. **`delete-project`** - `/src/tools/projects/deleteProject.ts`
   - Parameters: `projectId` (required), `confirm` (required, must be `true`)
   - Add strong warning about content moving to parent/default project
   - Require explicit confirmation

#### 1.3 Resource Access Checker Enhancement

**File:** `/src/tools/resourceAccessChecker.ts`

Add new method:
```typescript
async isProjectAllowed({
  projectId,
  restApiArgs
}): Promise<AllowedResult<Project>>
```

Follow pattern from `isDatasourceAllowed()` with caching.

---

### Phase 2: Users & Groups Management Tools

#### 2.1 SDK Foundation

**Files to create:**
- `/src/sdks/tableau/types/user.ts` - Enhance existing schema
- `/src/sdks/tableau/types/group.ts` - New schema
- `/src/sdks/tableau/apis/usersApi.ts` - Zodios API definitions
- `/src/sdks/tableau/apis/groupsApi.ts` - Zodios API definitions
- `/src/sdks/tableau/methods/usersMethods.ts` - Method wrappers
- `/src/sdks/tableau/methods/groupsMethods.ts` - Method wrappers

**User Schema Enhancement:**
```typescript
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  siteRole: z.string(),
  authSetting: z.string().optional(),
  lastLogin: z.string().optional(),
  externalAuthUserId: z.string().optional(),
});
```

**Group Schema:**
```typescript
export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.object({
    name: z.string(),
  }).optional(),
  minimumSiteRole: z.string().optional(),
  userCount: z.number().optional(),
  isExternalUserEnabled: z.boolean().optional(),
});
```

**API Endpoints (Users):**
- `GET /api/3.24/sites/:siteId/users` - List users
- `GET /api/3.24/sites/:siteId/users/:userId` - Get user
- `POST /api/3.24/sites/:siteId/users` - Create user
- `PUT /api/3.24/sites/:siteId/users/:userId` - Update user
- `DELETE /api/3.24/sites/:siteId/users/:userId` - Delete user
- `GET /api/3.24/sites/:siteId/users/:userId/groups` - List groups for user

**API Endpoints (Groups):**
- `GET /api/3.24/sites/:siteId/groups` - List groups
- `GET /api/3.24/sites/:siteId/groups/:groupId` - Get group
- `POST /api/3.24/sites/:siteId/groups` - Create group
- `PUT /api/3.24/sites/:siteId/groups/:groupId` - Update group
- `DELETE /api/3.24/sites/:siteId/groups/:groupId` - Delete group
- `GET /api/3.24/sites/:siteId/groups/:groupId/users` - List users in group
- `POST /api/3.24/sites/:siteId/groups/:groupId/users` - Add user to group
- `DELETE /api/3.24/sites/:siteId/groups/:groupId/users/:userId` - Remove user from group

**JWT Scopes Needed:**
- `tableau:users:read` (list, get)
- `tableau:users:create` (create)
- `tableau:users:update` (update)
- `tableau:users:delete` (delete)
- `tableau:groups:read` (list, get)
- `tableau:groups:create` (create)
- `tableau:groups:update` (update, add/remove users)
- `tableau:groups:delete` (delete)

#### 2.2 Tools to Implement

**Read Operations (Priority 1):**

1. **`list-users`** - `/src/tools/users/listUsers.ts`
   - Parameters: `filter`, `pageSize`, `pageNumber`, `limit`
   - Filter fields: name, friendlyName, domainName, siteRole, isLocal, lastLogin, luid
   - Create `/src/tools/users/usersFilterUtils.ts`

2. **`get-user`** - `/src/tools/users/getUser.ts`
   - Parameters: `userId` (required)

3. **`list-groups-for-user`** - `/src/tools/users/listGroupsForUser.ts`
   - Parameters: `userId` (required), `pageSize`, `pageNumber`, `limit`

4. **`list-groups`** - `/src/tools/groups/listGroups.ts`
   - Parameters: `filter`, `pageSize`, `pageNumber`, `limit`
   - Filter fields: name, domainName, domainNickname, isLocal, minimumSiteRole, userCount, isExternalUserEnabled, luid
   - Create `/src/tools/groups/groupsFilterUtils.ts`

5. **`get-group`** - `/src/tools/groups/getGroup.ts`
   - Parameters: `groupId` (required)

6. **`list-users-in-group`** - `/src/tools/groups/listUsersInGroup.ts`
   - Parameters: `groupId` (required), `pageSize`, `pageNumber`, `limit`

**Create/Update Operations (Priority 2):**

7. **`create-user`** - `/src/tools/users/createUser.ts`
   - Parameters: `name` (required), `siteRole` (required), `authSetting`, `email`
   - Admin-only

8. **`update-user`** - `/src/tools/users/updateUser.ts`
   - Parameters: `userId` (required), `fullName`, `email`, `siteRole`, `authSetting`
   - Admin-only

9. **`create-group`** - `/src/tools/groups/createGroup.ts`
   - Parameters: `name` (required), `minimumSiteRole`, `ephemeralUsersEnabled`
   - Admin-only

10. **`update-group`** - `/src/tools/groups/updateGroup.ts`
    - Parameters: `groupId` (required), `name`, `minimumSiteRole`
    - Admin-only

11. **`add-user-to-group`** - `/src/tools/groups/addUserToGroup.ts`
    - Parameters: `groupId` (required), `userId` (required)
    - Admin-only

**Delete Operations (Priority 3):**

12. **`remove-user-from-group`** - `/src/tools/groups/removeUserFromGroup.ts`
    - Parameters: `groupId` (required), `userId` (required)
    - Admin-only

13. **`delete-user`** - `/src/tools/users/deleteUser.ts`
    - Parameters: `userId` (required), `mapAssetsTo` (optional), `confirm` (required)
    - Strong warning about content ownership transfer
    - Recommend using `mapAssetsTo` parameter

14. **`delete-group`** - `/src/tools/groups/deleteGroup.ts`
    - Parameters: `groupId` (required), `confirm` (required)
    - Warning about removing all user-group associations

---

### Phase 3: Permissions Management Tools

#### 3.1 SDK Foundation

**Files to create:**
- `/src/sdks/tableau/types/permissions.ts` - Permissions schemas
- `/src/sdks/tableau/apis/permissionsApi.ts` - Zodios API definitions
- `/src/sdks/tableau/methods/permissionsMethods.ts` - Method wrappers

**Permissions Schema:**
```typescript
export const capabilitySchema = z.object({
  name: z.string(),
  mode: z.enum(['Allow', 'Deny']),
});

export const granteeCapabilitiesSchema = z.object({
  user: z.object({ id: z.string() }).optional(),
  group: z.object({ id: z.string() }).optional(),
  capabilities: z.object({
    capability: z.array(capabilitySchema),
  }),
});

export const permissionsSchema = z.object({
  granteeCapabilities: z.array(granteeCapabilitiesSchema),
  parent: z.object({
    id: z.string(),
    type: z.string(),
  }).optional(),
});
```

**API Endpoints:**
- `GET /api/3.24/sites/:siteId/projects/:projectId/permissions`
- `GET /api/3.24/sites/:siteId/workbooks/:workbookId/permissions`
- `GET /api/3.24/sites/:siteId/datasources/:datasourceId/permissions`
- `GET /api/3.24/sites/:siteId/views/:viewId/permissions`
- `GET /api/3.24/sites/:siteId/projects/:projectId/default-permissions/:resourceType`
- `PUT /api/3.24/sites/:siteId/:resourceType/:resourceId/permissions`
- `PUT /api/3.24/sites/:siteId/projects/:projectId/default-permissions/:resourceType`
- `DELETE /api/3.24/sites/:siteId/:resourceType/:resourceId/permissions/:granteeType/:granteeId/:capability/:mode`

**JWT Scopes Needed:**
- `tableau:permissions:read` (list)
- `tableau:permissions:update` (add, update)
- `tableau:permissions:delete` (delete)

#### 3.2 Capability Validator Utility

**File:** `/src/utils/permissions/capabilityValidator.ts`

Create validator for capability names per resource type:
```typescript
const validCapabilities = {
  workbooks: ['Read', 'Write', 'ChangePermissions', 'Delete', 'DownloadWorkbook', 'ViewComments', 'AddComment', 'Filter', 'ViewUnderlyingData', 'ShareView', 'WebAuthoring', 'RunExplainData', 'ExportImage', 'ExportData', 'ExportXml', 'CreateRefreshMetrics'],
  datasources: ['Read', 'Write', 'ChangePermissions', 'Delete', 'Connect', 'ExportXml', 'SaveAs'],
  projects: ['ProjectLeader', 'Read', 'Write'],
  views: ['Read', 'Filter', 'ViewComments', 'AddComment', 'ViewUnderlyingData', 'ShareView', 'ExportImage', 'ExportData', 'WebAuthoring', 'RunExplainData', 'ExportXml', 'ChangePermissions', 'Delete'],
  // ... others
};

export function validateCapability(resourceType: string, capability: string): Result<void, Error>;
```

#### 3.3 Tools to Implement

**Read Operations (Priority 1):**

1. **`list-project-permissions`** - `/src/tools/permissions/listProjectPermissions.ts`
   - Parameters: `projectId` (required)
   - Validate bounded context

2. **`list-workbook-permissions`** - `/src/tools/permissions/listWorkbookPermissions.ts`
   - Parameters: `workbookId` (required)
   - Validate bounded context

3. **`list-datasource-permissions`** - `/src/tools/permissions/listDatasourcePermissions.ts`
   - Parameters: `datasourceId` (required)
   - Validate bounded context

4. **`list-view-permissions`** - `/src/tools/permissions/listViewPermissions.ts`
   - Parameters: `viewId` (required)
   - Validate via resourceAccessChecker

5. **`list-default-permissions`** - `/src/tools/permissions/listDefaultPermissions.ts`
   - Parameters: `projectId` (required), `resourceType` (required: workbooks, datasources, flows, metrics, lenses, dataroles, virtualconnections, databases, tables)
   - Validate bounded context

**Create/Update Operations (Priority 2):**

6. **`add-permissions`** - `/src/tools/permissions/addPermissions.ts`
   - Parameters: `resourceType` (required), `resourceId` (required), `granteeType` (required: user/group), `granteeId` (required), `capabilities` (required: array of {name, mode})
   - Validate capabilities using capabilityValidator
   - Requires ChangePermissions capability or admin
   - Document available capabilities per resource type

7. **`update-default-permissions`** - `/src/tools/permissions/updateDefaultPermissions.ts`
   - Parameters: `projectId` (required), `resourceType` (required), `granteeType` (required), `granteeId` (required), `capabilities` (required)
   - Admin or project leader only

**Delete Operations (Priority 3):**

8. **`delete-permissions`** - `/src/tools/permissions/deletePermissions.ts`
   - Parameters: `resourceType` (required), `resourceId` (required), `granteeType` (required), `granteeId` (required), `capability` (required), `mode` (required), `confirm` (required)
   - Warning about removing specific permission
   - Requires ChangePermissions or admin

---

### Phase 4: Extract Refresh Management Tools

#### 4.1 SDK Foundation

**Files to create:**
- `/src/sdks/tableau/types/extractRefreshTask.ts` - Task and schedule schemas
- `/src/sdks/tableau/apis/extractRefreshApi.ts` - Zodios API definitions
- `/src/sdks/tableau/methods/extractRefreshMethods.ts` - Method wrappers

**Extract Refresh Task Schema:**
```typescript
export const scheduleSchema = z.object({
  frequency: z.enum(['Hourly', 'Daily', 'Weekly', 'Monthly']),
  // Frequency-specific parameters
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  // ... other schedule fields
});

export const extractRefreshSchema = z.object({
  type: z.enum(['fullRefresh', 'incrementalRefresh']),
  datasource: z.object({ id: z.string() }).optional(),
  workbook: z.object({ id: z.string() }).optional(),
});

export const extractRefreshTaskSchema = z.object({
  id: z.string(),
  priority: z.number().optional(),
  consecutiveFailedCount: z.number().optional(),
  type: z.string(),
  extractRefresh: extractRefreshSchema,
  schedule: scheduleSchema.optional(),
});
```

**API Endpoints:**
- `GET /api/3.24/sites/:siteId/tasks/extractRefreshes` - List tasks
- `GET /api/3.24/sites/:siteId/tasks/extractRefreshes/:taskId` - Get task
- `POST /api/3.24/sites/:siteId/tasks/extractRefreshes` - Create task
- `POST /api/3.24/sites/:siteId/tasks/extractRefreshes/:taskId` - Update task
- `POST /api/3.24/sites/:siteId/tasks/extractRefreshes/:taskId/runNow` - Run task now
- `DELETE /api/3.24/sites/:siteId/tasks/extractRefreshes/:taskId` - Delete task

**JWT Scopes Needed:**
- `tableau:tasks:read` (list, get)
- `tableau:tasks:create` (create)
- `tableau:tasks:update` (update)
- `tableau:tasks:run` (run)
- `tableau:tasks:delete` (delete)

#### 4.2 Schedule Validator Utility

**File:** `/src/utils/schedules/scheduleValidator.ts`

Create validator for schedule configurations:
```typescript
export function validateSchedule(
  frequency: string,
  scheduleParams: unknown
): Result<Schedule, Error>;
```

Validate:
- Required fields per frequency type
- Time format validation
- Interval constraints
- Day of week/month validation

#### 4.3 Tools to Implement

**Read Operations (Priority 1):**

1. **`list-extract-refresh-tasks`** - `/src/tools/extractRefresh/listExtractRefreshTasks.ts`
   - Parameters: `pageSize`, `pageNumber`, `limit`
   - Admins see all tasks, others see only owned tasks
   - Filter by bounded context (datasource/workbook restrictions)

2. **`get-extract-refresh-task`** - `/src/tools/extractRefresh/getExtractRefreshTask.ts`
   - Parameters: `taskId` (required)
   - Task owners and administrators only

**Create/Update Operations (Priority 2):**

3. **`create-extract-refresh-task`** - `/src/tools/extractRefresh/createExtractRefreshTask.ts`
   - Parameters: `extractRefresh` (required: {type, datasourceId OR workbookId}), `schedule` (required: {frequency, ...schedule params})
   - Validate schedule using scheduleValidator
   - Check bounded context for datasource/workbook
   - Admin and Creator role (Tableau Cloud only, API 3.20+)
   - Document Tableau Cloud vs Server differences

4. **`update-extract-refresh-task`** - `/src/tools/extractRefresh/updateExtractRefreshTask.ts`
   - Parameters: `taskId` (required), `schedule`, `extractRefresh`
   - Admin and task owners (Tableau Cloud only, API 3.20+)

5. **`run-extract-refresh-task`** - `/src/tools/extractRefresh/runExtractRefreshTask.ts`
   - Parameters: `taskId` (required)
   - Returns job ID for tracking
   - Task owners and administrators
   - Note: immediate execution, not scheduling

**Delete Operations (Priority 3):**

6. **`delete-extract-refresh-task`** - `/src/tools/extractRefresh/deleteExtractRefreshTask.ts`
   - Parameters: `taskId` (required), `confirm` (required)
   - Warning about deleting scheduled task
   - Task owners and administrators

---

## Tool Registration Changes

### File: `/src/tools/toolName.ts`

Add to `toolNames` array:
```typescript
// Projects (5 tools)
'list-projects', 'get-project', 'create-project', 'update-project', 'delete-project',

// Users (6 tools)
'list-users', 'get-user', 'list-groups-for-user', 'create-user', 'update-user', 'delete-user',

// Groups (8 tools)
'list-groups', 'get-group', 'list-users-in-group', 'create-group', 'update-group', 'delete-group',
'add-user-to-group', 'remove-user-from-group',

// Permissions (8 tools)
'list-project-permissions', 'list-workbook-permissions', 'list-datasource-permissions',
'list-view-permissions', 'list-default-permissions', 'add-permissions',
'update-default-permissions', 'delete-permissions',

// Extract Refresh (6 tools)
'list-extract-refresh-tasks', 'get-extract-refresh-task', 'create-extract-refresh-task',
'update-extract-refresh-task', 'run-extract-refresh-task', 'delete-extract-refresh-task',
```

Add to `toolGroups`:
```typescript
export const toolGroups = {
  // ... existing groups
  project: ['list-projects', 'get-project', 'create-project', 'update-project', 'delete-project'],
  user: ['list-users', 'get-user', 'list-groups-for-user', 'create-user', 'update-user', 'delete-user'],
  group: ['list-groups', 'get-group', 'list-users-in-group', 'create-group', 'update-group', 'delete-group', 'add-user-to-group', 'remove-user-from-group'],
  permissions: ['list-project-permissions', 'list-workbook-permissions', 'list-datasource-permissions', 'list-view-permissions', 'list-default-permissions', 'add-permissions', 'update-default-permissions', 'delete-permissions'],
  'extract-refresh': ['list-extract-refresh-tasks', 'get-extract-refresh-task', 'create-extract-refresh-task', 'update-extract-refresh-task', 'run-extract-refresh-task', 'delete-extract-refresh-task'],
};
```

### File: `/src/tools/tools.ts`

Import and register all factory functions:
```typescript
// Projects
import { getListProjectsTool } from './projects/listProjects.js';
import { getGetProjectTool } from './projects/getProject.js';
import { getCreateProjectTool } from './projects/createProject.js';
import { getUpdateProjectTool } from './projects/updateProject.js';
import { getDeleteProjectTool } from './projects/deleteProject.js';

// ... similar for users, groups, permissions, extractRefresh

export const toolFactories = [
  // ... existing tools
  getListProjectsTool,
  getGetProjectTool,
  getCreateProjectTool,
  getUpdateProjectTool,
  getDeleteProjectTool,
  // ... all other new tools
];
```

---

## Critical Implementation Patterns

### Admin-Only Validation

For tools requiring admin privileges:
```typescript
// Early in callback function
const authInfo = getTableauAuthInfo(authInfo);
if (!authInfo.isAdmin) {
  return new Err({
    type: 'permission-denied',
    message: 'This operation requires Tableau Server administrator privileges.'
  });
}
```

### Destructive Operation Confirmation

For all delete operations:
```typescript
// In paramsSchema
const paramsSchema = {
  resourceId: z.string(),
  confirm: z.boolean().refine(val => val === true, {
    message: 'You must explicitly set confirm: true to delete this resource'
  })
};
```

Add clear warnings in tool description:
```markdown
**WARNING: This is a destructive operation that cannot be undone.**
```

### Filter Implementation

Follow existing pattern from datasources:
```typescript
// In {resource}FilterUtils.ts
export const {resource}FilterFieldSchema = z.enum([
  'name', 'createdAt', 'updatedAt', // ... all fields
]);

export const allowedOperatorsByField: AllowedOperatorsByField<ResourceFilterField> = {
  name: ['eq', 'in'],
  createdAt: ['eq', 'gt', 'gte', 'lt', 'lte'],
  // ... map all fields to operators
};

export function parseAndValidate{Resource}FilterString(filterString: string): string {
  return parseAndValidateFilterString({
    filterString,
    allowedOperatorsByField,
    filterFieldSchema: {resource}FilterFieldSchema,
  });
}
```

### Tool Description Format

Each tool must include:
```typescript
description: `
# {Tool Name}

{Purpose statement}

## Parameters

- \`param1\` (required/optional): {Description}
- ...

## Permissions

{Required roles and JWT scopes}

## Examples

\`\`\`
{Example usage}
\`\`\`

${resource === 'list' ? genericFilterDescription : ''}
${resource === 'delete' ? '**WARNING: Destructive operation**' : ''}
`
```

---

## Testing Strategy

### Unit Tests (Per Tool)

Create `{toolName}.test.ts` for each tool:
- Valid parameter combinations
- Invalid parameters (schema validation)
- Filter string parsing (for list operations)
- Bounded context filtering
- Permission validation
- Error scenarios

### Integration Tests

Create E2E workflows in `/tests/e2e/`:
- **Admin workflow**: Create project → set permissions → add users
- **Group management**: Create group → add users → assign to project permissions
- **Extract refresh**: Create task → update schedule → run → delete
- **Permission inheritance**: Set default permissions → create content → verify inheritance

### Security Tests

Verify:
- Admin-only operations reject non-admin users
- Bounded context restrictions enforced
- Confirmation parameters required for destructive operations
- JWT scopes properly enforced

---

## Verification Plan

After each phase, verify:

### 1. Build Success
```bash
npm run build
```
Should complete without TypeScript errors.

### 2. Unit Tests Pass
```bash
npm test
```
All unit tests should pass.

### 3. Tool Registration
```bash
npm run inspect
```
Verify new tools appear in MCP Inspector with correct schemas.

### 4. API Integration
Test each tool with real Tableau Server/Cloud:
- Use MCP Inspector to invoke tools
- Verify correct API calls (check server logs)
- Verify correct responses
- Test error scenarios

### 5. Bounded Context
Configure bounded context restrictions and verify:
- List tools filter results appropriately
- Get/update/delete tools reject disallowed resources
- Clear error messages when access denied

### 6. Admin Validation
Test with non-admin user:
- Read operations should work
- Create/update/delete operations should fail with clear message

### 7. Destructive Operations
Test delete operations:
- Without `confirm` parameter → should fail
- With `confirm: false` → should fail
- With `confirm: true` → should succeed

---

## Documentation Updates

### Main README
Add new section:
```markdown
## Administration Tools

The MCP server now includes comprehensive tools for Tableau server administrators:

### Projects Management
- list-projects, get-project, create-project, update-project, delete-project

### Users & Groups
- list-users, get-user, create-user, update-user, delete-user
- list-groups, get-group, create-group, update-group, delete-group
- add-user-to-group, remove-user-from-group

### Permissions
- list-{resource}-permissions, add-permissions, update-default-permissions, delete-permissions

### Extract Refresh
- list-extract-refresh-tasks, create-extract-refresh-task, run-extract-refresh-task

See [Administration Guide](docs/administration-guide.md) for details.
```

### New Documentation Files

Create `/docs/administration-guide.md`:
- Overview of admin tools
- Security model and required permissions
- Bounded context implications for admin tools
- Common workflows with examples
- Best practices
- Troubleshooting

---

## Risk Mitigation

### High-Risk Areas

1. **Destructive Operations**
   - Mitigation: Require `confirm: true`, add strong warnings, document recovery procedures

2. **Permission Model Complexity**
   - Mitigation: Capability validator, extensive examples, clear error messages

3. **Admin Privilege Escalation**
   - Mitigation: Early privilege validation, proper JWT scopes, audit logging

### Platform Compatibility

Some features differ between Tableau Server and Cloud:
- Document API version requirements per tool
- Note platform-specific limitations in tool descriptions
- Consider version detection for graceful degradation

---

## Summary of Deliverables

**Total New Tools: 33**
- Projects: 5 tools
- Users: 6 tools
- Groups: 8 tools
- Permissions: 8 tools
- Extract Refresh: 6 tools

**New SDK Components:**
- 5 new API definition files
- 5 new methods classes
- 4 new type schema files

**New Utilities:**
- 3 filter utils (projects, users, groups)
- 1 capability validator (permissions)
- 1 schedule validator (extract refresh)
- Resource access checker enhancements

**Documentation:**
- Administration guide
- Updated API reference
- Usage examples

**Tests:**
- 33 unit test files
- E2E test suites for admin workflows
- Security test coverage

---

## Implementation Timeline Estimate

**Phase 1 (Projects):** ~1-2 weeks
- SDK layer + 5 tools + tests

**Phase 2 (Users & Groups):** ~2-3 weeks
- SDK layer + 14 tools + tests

**Phase 3 (Permissions):** ~1-2 weeks
- SDK layer + capability validator + 8 tools + tests

**Phase 4 (Extract Refresh):** ~1-2 weeks
- SDK layer + schedule validator + 6 tools + tests

**Total:** ~5-9 weeks for full implementation

---

## Critical Files Reference

**Must Read Before Implementation:**
- `/src/tools/tool.ts` - Core Tool class pattern
- `/src/tools/listDatasources/listDatasources.ts` - Reference for list operations
- `/src/tools/queryDatasource/queryDatasource.ts` - Reference for validation and error handling
- `/src/sdks/tableau/apis/datasourcesApi.ts` - Reference for API definitions
- `/src/utils/parseAndValidateFilterString.ts` - Filter validation pattern
- `/src/tools/resourceAccessChecker.ts` - Bounded context pattern

**API Documentation:**
- Projects: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_projects.htm
- Users & Groups: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_users_and_groups.htm
- Permissions: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_permissions.htm
- Extract Refresh: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref_extract_and_encryption.htm
