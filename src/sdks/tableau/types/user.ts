import { z } from 'zod';

// Minimal user schema (used in nested references like project.owner)
export const minimalUserSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
});

// Full user schema for Users API responses
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  siteRole: z.string().optional(),
  authSetting: z.string().optional(),
  lastLogin: z.string().optional(),
  externalAuthUserId: z.string().optional(),
  locale: z.string().optional(),
  language: z.string().optional(),
});

export type User = z.infer<typeof userSchema>;
export type MinimalUser = z.infer<typeof minimalUserSchema>;
