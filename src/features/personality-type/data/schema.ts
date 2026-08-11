import { z } from "zod";

export const personalityTypeSchema = z.object({
  code: z.string(),
  description_en: z.string().nullable(),
  description_th: z.string().nullable(),
  explain: z.string().nullable(),
  archetype: z.string().nullable(),
});
export type PersonalityTypeRow = z.infer<typeof personalityTypeSchema>;
