// Data + local persistence for the "Gifts from God" spiritual gifts
// assessment card. There is no `spiritual_gifts` table in Supabase yet —
// scores are edited in a form and saved to this browser's localStorage,
// keyed per lamb. The category grouping below is an editorial judgment
// call (not from a canonical source); adjust freely once a real
// assessment/scoring model is defined.

export const GIFT_CATEGORIES = [
  'Teaching',
  'Compassion',
  'Leadership',
  'Prophecy',
  'Service',
  'Evangelism',
] as const

export type GiftCategory = (typeof GIFT_CATEGORIES)[number]

export type Gift = {
  name: string
  category: GiftCategory
  // Score on a 0–15 scale, matching the reference detailed-view chart.
  score: number
}

// Default/fallback scores — used until a lamb has their own saved scores.
export const DEFAULT_GIFTS: Gift[] = [
  { name: 'เผยพระวจนะ', category: 'Prophecy', score: 8 },
  { name: 'อภิบาล', category: 'Leadership', score: 6 },
  { name: 'การสอน', category: 'Teaching', score: 11 },
  { name: 'ถ้อยคำประกอบด้วยสติปัญญา', category: 'Teaching', score: 9 },
  { name: 'ถ้อยคำประกอบด้วยความรู้', category: 'Teaching', score: 10 },
  { name: 'การตักเตือนและหนุนใจ', category: 'Compassion', score: 10 },
  { name: 'การรับใช้วิญญาณ', category: 'Prophecy', score: 6 },
  { name: 'การบริจาค', category: 'Service', score: 7 },
  { name: 'การประนีประนอม', category: 'Compassion', score: 9 },
  { name: 'ความเมตตา', category: 'Compassion', score: 12 },
  { name: 'มีชัยชนะ', category: 'Leadership', score: 6 },
  { name: 'ผู้ประกาศ', category: 'Evangelism', score: 10 },
  { name: 'การรับรองแขก', category: 'Service', score: 8 },
  { name: 'ความเชื่อ', category: 'Leadership', score: 11 },
  { name: 'ผู้ครอบครอง', category: 'Leadership', score: 7 },
  { name: 'ผู้บริหาร', category: 'Leadership', score: 8 },
  { name: 'การอัศจรรย์', category: 'Prophecy', score: 5 },
  { name: 'การรักษาโรค', category: 'Compassion', score: 6 },
  { name: 'การพูดภาษาแปลก', category: 'Prophecy', score: 4 },
  { name: 'การแปลภาษาแปลก', category: 'Prophecy', score: 4 },
  { name: 'อัครทูต', category: 'Evangelism', score: 7 },
  { name: 'การอยู่เป็นโสด', category: 'Service', score: 5 },
  { name: 'การอธิษฐานอ้อนวอน', category: 'Service', score: 10 },
  { name: 'การช่วยเหลือ', category: 'Service', score: 9 },
  { name: 'ผู้อุปถัมภ์', category: 'Compassion', score: 7 },
]

export const GIFT_SCORE_MIN = 0
export const GIFT_SCORE_MAX = 15

// Gift name -> score. Only the scores are persisted; name/category always
// come from DEFAULT_GIFTS so the edit form can't drift out of sync with it.
export type GiftScores = Record<string, number>

function storageKey(lambId: string) {
  return `lamb-gifts:${lambId}`
}

export function getStoredGiftScores(lambId: string): GiftScores | null {
  try {
    const raw = window.localStorage.getItem(storageKey(lambId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return parsed as GiftScores
  } catch {
    return null
  }
}

export function saveGiftScores(lambId: string, scores: GiftScores) {
  window.localStorage.setItem(storageKey(lambId), JSON.stringify(scores))
}

// Merges saved overrides (if any) on top of the default gift list, so the
// UI always has a complete, ordered 25-item list to render.
export function mergeGiftScores(scores: GiftScores | null): Gift[] {
  return DEFAULT_GIFTS.map((gift) => ({
    ...gift,
    score: scores?.[gift.name] ?? gift.score,
  }))
}

export function getDefaultGiftScores(): GiftScores {
  return Object.fromEntries(DEFAULT_GIFTS.map((g) => [g.name, g.score]))
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
