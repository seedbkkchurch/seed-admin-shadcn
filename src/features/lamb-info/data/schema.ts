import { z } from 'zod'

export const lambInfoSchema = z.object({
  id: z.string(),
  nick_name: z.string().nullable(),
  profile_picture: z.string().nullable(),
  tags: z.string().nullable(),
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
  // Progress through the fixed 18-chapter growth curriculum (see
  // data/lessons.ts GROWTH_LESSONS) — a count of chapters completed, e.g.
  // 7 means chapters 1-7 are done. Separate track from life-topic lessons.
  // .optional() (not just .nullable()) because lamb-info-action-dialog's
  // create/update form doesn't manage these fields yet (read-only display
  // only, see growth-progress-card.tsx) — its payload omits them entirely,
  // and LambInfoInput (Omit<LambInfo, 'id'>) must allow that.
  lamb_lesson_ch18_progress: z.number().nullable().optional(),
  lamb_lesson_life_progress: z.number().nullable().optional(),
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
