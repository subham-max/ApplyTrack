// src/validation/applications.schema.ts
import { z } from 'zod';

export const StatusEnum = z.enum(['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED']);

export const createApplicationSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  jobUrl: z.string().url().optional(),
  resumeVersion: z.string().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

export const updateStatusSchema = z.object({
  status: StatusEnum,
  note: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;