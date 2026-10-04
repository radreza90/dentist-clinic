import { z } from "zod";

export const siteSettingsInput = z.object({
  clinicName: z.object({ fa:z.string().max(300), en:z.string().max(300) }).optional(),
  description: z.object({ fa:z.string().max(5000), en:z.string().max(5000) }).optional(),
  phones: z.array(z.string().trim().max(30)).max(10).optional(),
  whatsapp: z.string().trim().max(50).optional(),
  address: z.object({ fa:z.string().max(1000), en:z.string().max(1000) }).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  socials: z.object({
    instagram:z.string().max(500).optional(),
    whatsapp:z.string().max(500).optional(),
    telegram:z.string().max(500).optional()
  }).optional(),
  workingHours: z.record(z.string(), z.unknown()).optional(),
  logoMediaId:z.string().nullable().optional(),
  faviconMediaId:z.string().nullable().optional(),
  defaultSeo:z.unknown().optional(),
  timezone:z.string().trim().max(100).optional(),
});