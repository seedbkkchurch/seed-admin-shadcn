import { z } from 'zod'

export const lambInfoSchema = z.object({
  id: z.string(),
  nick_name: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string().nullable(),
  adddress: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  bithday: z.string().nullable(),
  job: z.string().nullable(),
  interesting: z.string().nullable(),
  istimote: z.boolean().nullable(),
  status: z.boolean().nullable(),
  group_id: z.string().nullable(),
  age: z.number().nullable(),
  age_in_god: z.number().nullable(),
  remark: z.string().nullable(),
  previous_chruch: z.string().nullable(),
  personality_code: z.string().nullable(),
})
export type LambInfo = z.infer<typeof lambInfoSchema>

export type GroupCare = {
  id: string
  name: string | null
}

export type PersonalityType = {
  code: string
  description: string | null
}

// Row shape returned by the list query (lamb_info joined with its
// related lookup tables via Supabase's embedded resource syntax).
export type LambInfoRow = LambInfo & {
  group_care: { id: string; name: string | null } | null
  personality_type: { code: string; description: string | null } | null
}
