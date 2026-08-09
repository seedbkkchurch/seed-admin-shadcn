// เฝ้าเดี่ยว (personal daily devotion) submission history.
//
// There is no backing Supabase table for this yet — the database has no
// data to show. Until that table exists, this module fabricates a
// deterministic-per-lamb mock history (so the UI has something believable
// to render and the calendar looks the same on every reload) and the
// profile page layers any devotions submitted through the upload dialog
// on top of it, in local component state only (see devotion-section.tsx).
// Nothing here is persisted — a page refresh drops anything the user
// submitted in this session and falls back to the mock history again.

export type DevotionType = 'text' | 'image'

export type DevotionEntry = {
  // yyyy-MM-dd, always local calendar date.
  date: string
  type: DevotionType
  // Present when type === 'text'.
  content: string | null
  // Present when type === 'image' — a local object URL or data URI, never
  // an uploaded/persisted asset (see devotion-upload-dialog.tsx).
  imageUrl: string | null
}

const MOCK_TEXT_SNIPPETS = [
  'วันนี้อ่านพระธรรมสดุดี 23 พระเจ้าทรงเลี้ยงดูข้าพเจ้าเหมือนเลี้ยงแกะ รู้สึกอบอุ่นใจมาก',
  'อ่านโรม 8 ตอนที่ไม่มีสิ่งใดพรากเราจากความรักของพระเจ้าได้ ขอบคุณพระเจ้าสำหรับพระคุณ',
  'อธิษฐานขอบคุณพระเจ้าสำหรับครอบครัวและเพื่อนในกลุ่มเซล',
  'เฝ้าเดี่ยวเช้านี้จากยอห์น 15 เรื่องการเป็นแขนงที่ติดสนิทกับเถาองุ่น',
  'อ่านฟีลิปปี 4:6-7 เรื่องการอธิษฐานแทนความกังวล รู้สึกสงบใจขึ้นมาก',
  'วันนี้ทบทวนบทเรียนเรื่องความเชื่อ และอธิษฐานเผื่อทีมรับใช้',
  'อ่านสุภาษิต 3:5-6 ไว้วางใจพระเจ้าสุดใจ ไม่พึ่งพาความเข้าใจของตนเอง',
  'เฝ้าเดี่ยวเรื่องความรักของพระเจ้าจาก 1 โครินธ์ 13',
]

// Tiny inline placeholder — keeps mock "photo" devotions self-contained
// with no network dependency (no real image was ever uploaded for these).
const MOCK_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='320' height='200' fill='%23e0dcf9'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%237c6ff0' text-anchor='middle' dominant-baseline='middle'%3E%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B9%80%E0%B8%9D%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%94%E0%B8%B5%E0%B9%88%E0%B8%A2%E0%B8%A7 (mock)%3C/text%3E%3C/svg%3E"

// Simple deterministic string hash (djb2) → used to seed a per-day
// pseudo-random decision so the same lamb + date always renders the same
// mock result (e.g. across month navigation, re-renders, page reloads).
function hashSeed(input: string): number {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i)
  }
  return hash >>> 0
}

function seededFloat(seed: number): number {
  // mulberry32
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Mock submission for a single day — never returns an entry for a future
// date (there's nothing to have "submitted" yet). Roughly 70% of past/
// today days come back submitted, mixing text and image types.
export function getMockDevotionForDate(
  lambId: string,
  date: Date,
  today: Date
): DevotionEntry | null {
  const dateKey = toDateKey(date)
  if (date > today) return null

  const seed = hashSeed(`${lambId}:${dateKey}`)
  const submitted = seededFloat(seed) < 0.7
  if (!submitted) return null

  const isText = seededFloat(seed + 1) < 0.6
  if (isText) {
    const idx = Math.floor(
      seededFloat(seed + 2) * MOCK_TEXT_SNIPPETS.length
    )
    return {
      date: dateKey,
      type: 'text',
      content: MOCK_TEXT_SNIPPETS[idx],
      imageUrl: null,
    }
  }
  return {
    date: dateKey,
    type: 'image',
    content: null,
    imageUrl: MOCK_IMAGE_PLACEHOLDER,
  }
}
