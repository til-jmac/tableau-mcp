# Zodios Request Patterns (POST/PUT/DELETE)

## Problem We Solved
First POST/PUT/DELETE implementations in this codebase. All previous methods were GET requests, so there was no reference pattern for write operations with Zodios.

## The Solution

### 1. API Endpoint Definition (`apis/*.ts`)

The Body parameter schema must **include the top-level wrapper** that matches the expected HTTP request body structure:

```typescript
const createProjectEndpoint = makeEndpoint({
  method: 'post',
  path: '/sites/:siteId/projects',
  alias: 'createProject',
  parameters: [
    {
      name: 'siteId',
      type: 'Path',
      schema: z.string(),
    },
    {
      name: 'project',           // ← Parameter name
      type: 'Body',
      schema: z.object({
        project: z.object({      // ← Top-level key in HTTP body
          name: z.string(),
          description: z.string().optional(),
          // ... other fields
        }),
      }),
    },
  ],
  response: z.object({
    project: projectSchema,
  }),
});
```

**Key insight:** The schema defines the ENTIRE HTTP request body structure, including the top-level wrapper.

### 2. Method Call (`methods/*.ts`)

Use **TWO separate arguments**:
1. First argument: Body data (matches the Body parameter schema)
2. Second argument: Config object (path params, headers, etc.)

```typescript
createProject = async ({
  siteId,
  project,
}: {
  siteId: string;
  project: { name: string; description?: string; /* ... */ };
}): Promise<Project> => {
  // Filter out undefined values using spread operator
  const projectData = {
    name: project.name,
    ...(project.description !== undefined ? { description: project.description } : {}),
    ...(project.contentPermissions !== undefined
      ? { contentPermissions: project.contentPermissions }
      : {}),
    // ... other optional fields
  };

  return (
    await this._apiClient.createProject(
      { project: projectData },                    // ← First arg: Body (matches schema)
      { params: { siteId }, ...this.authHeader }   // ← Second arg: Config (path params, headers)
    )
  ).project;
};
```

### 3. Resulting HTTP Request

With the above pattern, the actual HTTP request sent is:

```http
POST /api/3.24/sites/026da220-42c5-4712-a0dd-36bd3b4f92b7/projects
Content-Type: application/json
X-Tableau-Auth: ...

{
  "project": {
    "name": "testing new project",
    "description": "..."
  }
}
```

## Why This Works

1. **Schema matches HTTP body structure:** The `z.object({ project: z.object({...}) })` schema exactly matches what goes in the HTTP body
2. **Two-argument pattern separates concerns:**
   - First argument = HTTP body
   - Second argument = HTTP config (path params, query params, headers)
3. **Zodios validates against the schema:** When we pass `{ project: projectData }`, Zodios validates it against the Body parameter schema and if valid, sends it as the HTTP request body

## What Didn't Work (Lessons Learned)

### ❌ Passing everything in one object
```typescript
await this._apiClient.createProject({
  params: { siteId },
  project: projectData,
  ...this.authHeader
})
```
**Problem:** Zodios tried to validate the entire object `{ params, project, headers }` against the Body schema, causing validation errors.

### ❌ Schema without wrapper
```typescript
schema: z.object({
  name: z.string(),
  description: z.string().optional(),
})
```
**Problem:** This would create HTTP body `{ name: "...", description: "..." }` but Tableau expects `{ project: { name: "...", description: "..." } }`.

### ❌ Using spread operator incorrectly with undefined values
```typescript
const projectData = {
  name: project.name,
  description: project.description,  // Could be undefined!
  ...
};
```
**Problem:** Sends `{ name: "...", description: undefined }` which fails Tableau validation. Must filter out undefined values.

## Pattern for Future Phases

Use this pattern for all future POST/PUT operations:

1. **Schema includes the wrapper:** `z.object({ outerKey: z.object({ innerFields }) })`
2. **Two-argument call:** `apiClient.method(bodyData, configObject)`
3. **Filter undefined values:** Use spread operator with conditional inclusion

### Example for Users API:
```typescript
// API definition
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
}

// Method call
await this._apiClient.createUser(
  { user: { name, siteRole, ...(authSetting ? { authSetting } : {}) } },
  { params: { siteId }, ...this.authHeader }
)
```

## Debugging Tips

1. **Add axios interceptor logging** (see `restApi.ts` line 266-275) to see actual HTTP requests
2. **Log before API call** to see what Zodios receives
3. **Check if HTTP request is actually sent** - if it fails validation, no request happens
4. **ZodError messages** show which path failed validation

---

## DELETE Request Pattern

DELETE requests have NO body but still need path parameters and headers. The two-argument pattern is **required** for path params to be substituted correctly.

### API Endpoint Definition

```typescript
const deleteProjectEndpoint = makeEndpoint({
  method: 'delete',
  path: '/sites/:siteId/projects/:projectId',
  alias: 'deleteProject',
  parameters: [
    { name: 'siteId', type: 'Path', schema: z.string() },
    { name: 'projectId', type: 'Path', schema: z.string() },
  ],
  response: z.void(),
});
```

### Method Call - CRITICAL

Use `undefined` as the first argument (body placeholder), config as second:

```typescript
deleteProject = async ({ siteId, projectId }): Promise<void> => {
  await this._apiClient.deleteProject(undefined, {
    params: { siteId, projectId },
    ...this.authHeader,
  });
};
```

### What Didn't Work

```typescript
// WRONG - path params NOT substituted, URL shows /sites/:siteId/projects/:projectId
await this._apiClient.deleteProject({
  params: { siteId, projectId },
  ...this.authHeader,
});
```

**Problem:** With single-argument pattern, Zodios doesn't recognize `params` and the path parameters remain as literals (`:siteId`, `:projectId`), causing 401 errors.

### Key Insight

Even though DELETE has no body, Zodios still expects the two-argument pattern when you have path parameters:
- First argument: `undefined` (no body)
- Second argument: Config object with `params` and headers

---

## Reference Files

- Working POST/PUT: `/src/sdks/tableau/apis/projectsApi.ts` (createProjectEndpoint, updateProjectEndpoint)
- Working DELETE: `/src/sdks/tableau/apis/projectsApi.ts` (deleteProjectEndpoint)
- Working methods: `/src/sdks/tableau/methods/projectsMethods.ts`
- Restart procedure: `/RESTART-PROCEDURE.md`
