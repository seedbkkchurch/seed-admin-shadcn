// Data helpers for the "Gifts from God" spiritual gifts assessment card.
// Backed by the `gift_from_god` Supabase table (one row per lamb, 25
// smallint score columns 0-15, keyed by lamb_id). See queries.ts for the
// actual fetch/upsert hooks.
//
// GIFT_DEFINITIONS' order/column mapping matches the original Excel import
// 1:1 (confirmed against the source spreadsheet) — do not reorder or
// rename without re-checking that mapping against the spreadsheet.

export const GIFT_CATEGORIES = [
  'Teaching',
  'Compassion',
  'Leadership',
  'Prophecy',
  'Service',
  'Evangelism',
] as const

export type GiftCategory = (typeof GIFT_CATEGORIES)[number]

export type GiftDefinition = {
  // Matches a smallint column name on the `gift_from_god` table.
  column: string
  name: string
  category: GiftCategory
}

export const GIFT_DEFINITIONS: GiftDefinition[] = [
  { column: 'prophet', name: 'เผยพระวจนะ', category: 'Prophecy' },
  { column: 'pastoral', name: 'อภิบาล', category: 'Leadership' },
  { column: 'teaching', name: 'การสอน', category: 'Teaching' },
  {
    column: 'word_of_wisdom',
    name: 'ถ้อยคำประกอบด้วยสติปัญญา',
    category: 'Teaching',
  },
  {
    column: 'words_with_knowledge',
    name: 'ถ้อยคำประกอบด้วยความรู้',
    category: 'Teaching',
  },
  {
    column: 'warning_and_encouragement',
    name: 'การตักเตือนและหนุนใจ',
    category: 'Compassion',
  },
  {
    column: 'discernment_of_spirits',
    name: 'การรับใช้วิญญาณ',
    category: 'Prophecy',
  },
  { column: 'offering', name: 'การบริจาค', category: 'Service' },
  { column: 'to_serve', name: 'การประนีประนอม', category: 'Compassion' },
  { column: 'compassion', name: 'ความเมตตา', category: 'Compassion' },
  { column: 'missionary', name: 'มีชัยชนะ', category: 'Leadership' },
  { column: 'preacher', name: 'ผู้ประกาศ', category: 'Evangelism' },
  { column: 'welcoming_guests', name: 'การรับรองแขก', category: 'Service' },
  { column: 'faith_trust', name: 'ความเชื่อ', category: 'Leadership' },
  { column: 'ruler', name: 'ผู้ครอบครอง', category: 'Leadership' },
  { column: 'executive', name: 'ผู้บริหาร', category: 'Leadership' },
  { column: 'miracle', name: 'การอัศจรรย์', category: 'Prophecy' },
  { column: 'healing_of_disease', name: 'การรักษาโรค', category: 'Compassion' },
  {
    column: 'speaking_in_tongues',
    name: 'การพูดภาษาแปลก',
    category: 'Prophecy',
  },
  {
    column: 'interpreting_tongues',
    name: 'การแปลภาษาแปลก',
    category: 'Prophecy',
  },
  { column: 'ambassador', name: 'อัครทูต', category: 'Evangelism' },
  { column: 'being_single', name: 'การอยู่เป็นโสด', category: 'Service' },
  {
    column: 'blessing_prayer',
    name: 'การอธิษฐานอ้อนวอน',
    category: 'Service',
  },
  { column: 'exorcism', name: 'การช่วยเหลือ', category: 'Service' },
  { column: 'supporter', name: 'ผู้อุปถัมภ์', category: 'Compassion' },
]

export const GIFT_SCORE_MIN = 0
export const GIFT_SCORE_MAX = 15

// column -> score
export type GiftScores = Record<string, number>

// Row shape returned by `gift_from_god` (one row per lamb): the fixed
// metadata columns, plus the 25 score columns from GIFT_DEFINITIONS.
// Deliberately NOT `GiftScores & {...}` — intersecting a `Record<string,
// number>` index signature with these string-typed fields would collapse
// lamb_id/image_url/etc. to `never`. The permissive index signature below
// avoids that; read scores via mergeGiftScores rather than relying on this
// type to enforce "number" on score columns.
export type GiftFromGodRow = {
  lamb_id: string
  image_url: string | null
  note: string | null
  created_at: string
  updated_at: string
} & {
  [column: string]: number | string | null
}

export type Gift = {
  column: string
  name: string
  category: GiftCategory
  score: number
}

// Always returns the full 25-item list, even when the lamb has no row yet
// in `gift_from_god` (row is null/undefined) — missing scores default to 0.
// Accepts either the raw Supabase row or a plain GiftScores map (e.g. from
// the edit form) since both key scores by column name.
export function mergeGiftScores(
  row: GiftFromGodRow | GiftScores | null | undefined
): Gift[] {
  return GIFT_DEFINITIONS.map((def) => {
    const raw = row?.[def.column]
    const score = typeof raw === 'number' ? raw : Number(raw ?? 0)
    return { ...def, score: Number.isFinite(score) ? score : 0 }
  })
}

export function getDefaultGiftScores(): GiftScores {
  return Object.fromEntries(GIFT_DEFINITIONS.map((g) => [g.column, 0]))
}

export function getGiftRadarData(gifts: Gift[]) {
  return GIFT_CATEGORIES.map((category) => {
    const items = gifts.filter((g) => g.category === category)
    const avg = items.reduce((sum, g) => sum + g.score, 0) / items.length
    return {
      category,
      score: Math.round((avg / GIFT_SCORE_MAX) * 100),
    }
  })
}
