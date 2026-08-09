import { useCallback, useMemo, useState } from 'react'
import { eachDayOfInterval, format, subDays } from 'date-fns'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getMockDevotionForDate, type DevotionEntry } from '../data/devotions'
import { DevotionHeatmap } from './devotion-heatmap'
import { DevotionUploadDialog } from './devotion-upload-dialog'

// เฝ้าเดี่ยว (personal daily devotion) history for a single lamb.
//
// No `lamb_devotion`-style table exists yet, so the graph below is
// backed by deterministic mock data (see data/devotions.ts) rather than a
// query. Anything submitted through the upload dialog is layered on top
// as local component state (`overrides`) — it lets the graph/total count
// react immediately to a submission, but it is not persisted: refreshing
// the page drops it and falls back to the mock history again.
//
// Layout is a GitHub-contribution-graph-style rolling 365-day strip (see
// devotion-heatmap.tsx) — no month navigation, no per-period stat tiles,
// just a single "X ครั้งในรอบ 1 ปีที่ผ่านมา" total, per grill-me
// follow-up (2026-08-09).
type DevotionSectionProps = {
  lambId: string
}

export function DevotionSection({ lambId }: DevotionSectionProps) {
  // Stable for the component's lifetime so the mock data and "today"
  // ring/in-range logic don't shift mid-session.
  const [today] = useState(() => new Date())
  const [overrides, setOverrides] = useState<Record<string, DevotionEntry>>(
    {}
  )
  const [uploadOpen, setUploadOpen] = useState(false)

  const getEntry = useCallback(
    (date: Date): DevotionEntry | null => {
      const key = format(date, 'yyyy-MM-dd')
      return overrides[key] ?? getMockDevotionForDate(lambId, date, today)
    },
    [overrides, lambId, today]
  )

  const handleSubmit = (entry: DevotionEntry) => {
    setOverrides((prev) => ({ ...prev, [entry.date]: entry }))
  }

  const yearCount = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(today, 364), end: today })
    return days.filter((d) => getEntry(d)).length
  }, [today, getEntry])

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='font-semibold'>ประวัติเฝ้าเดี่ยว</div>
          <p className='text-sm text-muted-foreground'>
            ส่งเฝ้าเดี่ยว {yearCount} ครั้งในรอบ 1 ปีที่ผ่านมา — ข้อมูลตัวอย่าง
            ยังไม่เชื่อมฐานข้อมูลจริง
          </p>
        </div>
        {/* Kept full-size — this stays the page's main call-to-action even
            though the graph next to it is small/dense. */}
        <Button size='lg' onClick={() => setUploadOpen(true)}>
          <Upload /> ส่งเฝ้าเดี่ยว
        </Button>
      </CardHeader>
      <CardContent>
        <DevotionHeatmap today={today} getEntry={getEntry} />
      </CardContent>

      <DevotionUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        today={today}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}
