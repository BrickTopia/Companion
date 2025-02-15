
import { z } from "zod";

export const settingsFormSchema = z.object({
  syncEnabled: z.boolean(),
  cachePolicy: z.enum(["normal", "minimal", "aggressive", "custom"]),
  customCacheDuration: z.string().optional(),
  syncFrequency: z.enum(["hourly", "daily", "weekly", "custom"]),
  customSyncInterval: z.string().optional(),
  serverSettings: z.object({
    baseUrl: z.string().url().optional(),
    endpoints: z.object({
      favorites: z.string(),
      userSettings: z.string(),
    }),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
