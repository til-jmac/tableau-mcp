import { z } from 'zod';

/**
 * Schedule interval schema - represents frequency-specific timing
 */
export const scheduleIntervalSchema = z.object({
  hours: z.number().optional(),
  minutes: z.number().optional(),
  weekDay: z.string().optional(),
  monthDay: z.string().optional(),
});

export type ScheduleInterval = z.infer<typeof scheduleIntervalSchema>;

/**
 * Frequency details schema - timing configuration for schedules
 */
export const frequencyDetailsSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  intervals: z
    .object({
      interval: z.array(scheduleIntervalSchema).optional(),
    })
    .optional(),
});

export type FrequencyDetails = z.infer<typeof frequencyDetailsSchema>;

/**
 * Schedule schema - defines when extract refreshes run
 */
export const scheduleSchema = z.object({
  id: z.string().optional(),
  frequency: z.enum(['Hourly', 'Daily', 'Weekly', 'Monthly']).optional(),
  nextRunAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  frequencyDetails: frequencyDetailsSchema.optional(),
});

export type Schedule = z.infer<typeof scheduleSchema>;

/**
 * Extract refresh schema - the refresh configuration
 */
export const extractRefreshSchema = z.object({
  id: z.string(),
  priority: z.number().optional(),
  consecutiveFailedCount: z.number().optional(),
  type: z.string().optional(),
  schedule: scheduleSchema.optional(),
  workbook: z.object({ id: z.string() }).optional(),
  datasource: z.object({ id: z.string() }).optional(),
});

export type ExtractRefresh = z.infer<typeof extractRefreshSchema>;

/**
 * Extract refresh task schema - wrapper for list responses
 */
export const extractRefreshTaskSchema = z.object({
  extractRefresh: extractRefreshSchema,
});

export type ExtractRefreshTask = z.infer<typeof extractRefreshTaskSchema>;

/**
 * Job schema - returned when running a task
 */
export const jobSchema = z.object({
  id: z.string(),
  mode: z.string().optional(),
  type: z.string().optional(),
});

export type Job = z.infer<typeof jobSchema>;

