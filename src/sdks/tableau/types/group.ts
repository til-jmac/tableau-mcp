import { z } from 'zod';

// Domain schema for groups
const groupDomainSchema = z.object({
  name: z.string(),
});

// Group schema for Groups API responses
export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: groupDomainSchema.optional(),
  minimumSiteRole: z.string().optional(),
  userCount: z.number().optional(),
  isExternalUserEnabled: z.boolean().optional(),
});

export type Group = z.infer<typeof groupSchema>;
