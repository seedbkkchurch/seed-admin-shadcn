import { z } from 'zod'

export const lambInfoSchema = z.object({
  id: z.string(),
  nick_name: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string().nullable(),
  address: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  birthday: z.string().nullable(),
  job: z.string().nullable(),
  interesting: z.string().nullable(),
  is_timote: z.boolean().nullable(),
  status: z.boolean().nullable(),
  // Raw foreign key value stored on lamb_info (references group_care.id).
  group_care: z.string().nullable(),
  age: z.number().nullable(),
  years_of_faith: z.number().nullable(),
  remark: z.string().nullable(),
  previous_church: z.string().nullable(),
  personality_code: z.string().nullable(),
})
export type LambInfo = z.infer<typeof lambInfoSchema>

export type GroupCare = {
  id: string
  name: string | null
}

export type PersonalityType = {
  code: string
  description_en: string | null
  description_th: string | null
  explain: string | null
  archetype: string | null
}

// Row shape returned by the list query (lamb_info joined with its
// related lookup tables via Supabase's embedded resource syntax).
// The embedded group lookup is aliased to `group_care_info` because the
// raw FK column on lamb_info is itself named `group_care`.
export type LambInfoRow = LambInfo & {
  group_care_info: { id: string; name: string | null } | null
  personality_type: {
    code: string
    description_en: string | null
    description_th: string | null
    explain: string | null
    archetype: string | null
  } | null
}
