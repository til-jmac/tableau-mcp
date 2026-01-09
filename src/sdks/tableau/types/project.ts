import { z } from 'zod';

// Owner schema for projects - API returns minimal user info (just id)
const projectOwnerSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  contentPermissions: z.enum(['LockedToProject', 'ManagedByOwner']).optional(),
  parentProjectId: z.string().optional(),
  owner: projectOwnerSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  controllingPermissionsProjectId: z.string().optional(),
});

export type Project = z.infer<typeof projectSchema>;
