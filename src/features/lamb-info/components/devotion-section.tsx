import { useMemo, useState } from 'react'
import { eachDayOfInterval, format, subDays } from 'date-fns'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLambDevotionHistory } from '../data/queries'
import { DevotionHeatmap, type DevotionHeatmapEntry } from './devotion-heatmap'
import { DevotionMonthlyChart } from './devotion-monthly-chart'
import { DevotionRecentList } from './devotion-recent-list'
import { DevotionUploadDialog } from './devotion-upload-dialog'

type DevotionView = 'day' | 'month' | 'year'

// Fixed rolling windows from today (no navigation) — matches the no-nav
// design already established for the daily heatmap (see
// devotion-heatmap.tsx doc comment / grill-me follow-up 2026-08-09).
const ONE_YEAR_DAYS_BACK = 364
const THREE_YEAR_DAYS_BACK = 3 * 365 - 1

type DevotionSectionProps = {
  lambId: string
}

// เฝ้าเดี่ยว (personal daily devotion) history for a single lamb — reads
// the real `lamb_devotion` table (both public and private rows; this is
// the admin's own view of the lamb's full history, so status doesn't
// change how a day reads here) with three switchable views: รายวัน
// (GitHub-style daily dots, ~1yr), รายเดือน (bar chart, rolling 12
// months), รายปี (GitHub-style daily dots, ~3yr). Per grill-me follow-up
// (2026-08-11) — replaces the earlier mock-data-only version
// (data/devotions.ts).
export function DevotionSection({ lambId }: DevotionSectionProps) {
  // Stable for the component's lifetime so "today" doesn't shift the
  // rolling windows mid-session.
  const [today] = useState(() => new Date())
  const [view, setView] = useState<DevotionView>('day')
  const [uploadOpen, setUploadOpen] = useState(false)

  const { data: entries, isPending } = useLambDevotionHistory(lambId)

  const entryByDate = useMemo(() => {
    const map = new Map<string, DevotionHeatmapEntry>()
    for (const entry of entries ?? []) {
      map.set(entry.devotion_date, {
        id: entry.id,
        title: entry.title,
        image_urls: entry.image_urls,
      })
    }
    return map
  }, [entries])

  const getEntry = (date: Date) =>
    entryByDate.get(format(date, 'yyyy-MM-dd')) ?? null

  // useLambDevotionHistory returns oldest-first (see queries.ts) — reverse
  // for the "ประวัติล่าสุด" list below the graph, which wants newest-first.
  const recentEntries = useMemo(
    () => (entries ?? []).slice().reverse(),
    [entries]
  )

  const oneYearCount = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, ONE_YEAR_DAYS_BACK),
      end: today,
    })
    return days.filter((d) => entryByDate.has(format(d, 'yyyy-MM-dd'))).length
  }, [today, entryByDate])

  const threeYearCount = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(today, THREE_YEAR_DAYS_BACK),
      end: today,
    })
    return days.filter((d) => entryByDate.has(format(d, 'yyyy-MM-dd'))).length
  }, [today, entryByDate])

  const statText =
    view === 'year'
      ? `ส่งเฝ้าเดี่ยว ${threeYearCount} ครั้งในรอบ 3 ปีที่ผ่านมา`
      : `ส่งเฝ้าเดี่ยว ${oneYearCount} ครั้งในรอบ 1 ปีที่ผ่านมา`

  return (
    <Card>
      <CardHeader className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <div className='font-semibold'>ประวัติเฝ้าเดี่ยว</div>
          <p className='text-sm text-muted-foreground'>{statText}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as DevotionView)}
          >
            <TabsList>
              <TabsTrigger value='day'>รายวัน</TabsTrigger>
              <TabsTrigger value='month'>รายเดือน</TabsTrigger>
              <TabsTrigger value='year'>รายปี</TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Mobile: icon-only so it doesn't crowd the Tabs on the same
              row. sm+: back to the full-text button. Two separate Buttons
              (rather than one Button with a conditionally-hidden label) so
              the icon one actually gets `size='icon'`'s square padding —
              Tailwind can't switch a component's `size` prop per
              breakpoint, only its className. Per grill-me follow-up
              (2026-08-11). */}
          <Button
            size='icon'
            className='sm:hidden'
            aria-label='ส่งเฝ้าเดี่ยว'
            onClick={() => setUploadOpen(true)}
          >
            <Upload />
          </Button>
          <Button
            size='lg'
            className='hidden sm:inline-flex'
            onClick={() => setUploadOpen(true)}
          >
            <Upload /> ส่งเฝ้าเดี่ยว
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-40 w-full' />
        ) : (
          <>
            {view === 'day' ? (
              <DevotionHeatmap
                today={today}
                daysBack={ONE_YEAR_DAYS_BACK}
                getEntry={getEntry}
              />
            ) : view === 'month' ? (
              <DevotionMonthlyChart today={today} entries={entries ?? []} />
            ) : (
              <DevotionHeatmap
                today={today}
                daysBack={THREE_YEAR_DAYS_BACK}
                getEntry={getEntry}
              />
            )}

            <DevotionRecentList lambId={lambId} entries={recentEntries} />
          </>
        )}
      </CardContent>

      <DevotionUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        lambId={lambId}
        today={today}
      />
    </Card>
  )
}
