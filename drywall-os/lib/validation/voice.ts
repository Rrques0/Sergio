import { z } from "zod";

export const voiceEstimateExtractionSchema = z.object({
  customer: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  }),
  address: z.string().optional(),
  jobType: z.string().optional(),
  rooms: z.array(z.string()).default([]),
  scope: z.string().optional(),
  materials: z.array(z.string()).default([]),
  laborCents: z.number().int().nonnegative().optional(),
  materialCents: z.number().int().nonnegative().optional(),
  depositPercent: z.number().min(0).max(100).optional(),
  notes: z.string().optional()
});

export type VoiceEstimateExtraction = z.infer<typeof voiceEstimateExtractionSchema>;
