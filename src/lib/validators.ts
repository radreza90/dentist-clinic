import { z } from "zod";

export const localizedStringInput = z.object({
  fa: z.string().trim().max(5000).optional().default(""),
  en: z.string().trim().max(5000).optional().default(""),
});

export const serviceInput = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9\u0600-\u06ff]+(?:-[a-z0-9\u0600-\u06ff]+)*$/i),
  title: localizedStringInput,
  excerpt: localizedStringInput.optional(),
  content: localizedStringInput.optional(),
  status: z.enum(["draft","published","scheduled","archived"]).optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
  suitableFor: z.array(localizedStringInput).optional(),
  benefits: z.array(localizedStringInput).optional(),
  limitations: z.array(localizedStringInput).optional(),
  careInstructions: z.array(localizedStringInput).optional(),
  faqs: z.array(z.object({question:localizedStringInput,answer:localizedStringInput})).optional(),
  icon: z.string().max(200).optional(),
  coverMediaId: z.string().optional().nullable(),
});

export const contentQuery = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["draft","published","scheduled","archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});