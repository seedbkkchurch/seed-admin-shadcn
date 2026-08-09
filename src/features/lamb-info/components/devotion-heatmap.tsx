import { Fragment } from 'react'
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import { ImageIcon, Type as TypeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { type DevotionEntry } from '../data/devotions'

// Continuous 365-day GitHub-contribution-style strip (per grill-me
// follow-up, 2026-08-09) — replaces the earlier single-month calendar +
// prev/next nav entirely. Weeks are columns (Sun row0 .. Sat row6), a
// month label appears above the first column of each new month, and
// there's no navigation: it always shows "today back 365 days", full
// stop, same as github.com's own graph.
const WEEKDAY_LABELS_TH: Record<number, string> = { 1: 'จ', 3: 'พ', 5: 'ศ' }
// Sized up ~40% and centered per grill-me follow-up, 2026-08-09.
const CELL_PX = 14
const GAP_PX = 4
const LABEL_COL_PX = 20
const MONTH_ROW_PX = 18

type DevotionHeatmapProps = {
  today: Date
  getEntry: (date: Date) => DevotionEntry | null
}

export function DevotionHeatmap({ today, getEntry }: DevotionHeatmapProps) {
  const rangeStart = subDays(today, 364)
  const gridStart = startOfWeek(rangeStart, { weekStartsOn: 0 })
  const gridEnd = endOfWeek(today, { weekStartsOn: 0 })
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const weeks: Date[][] = []
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7))
  }

  const monthLabelForWeek = (weekIndex: number): string | null => {
    const month = format(weeks[weekIndex][0], 'MM-yyyy')
    const prevMonth =
      weekIndex > 0 ? format(weeks[weekIndex - 1][0], 'MM-yyyy') : null
    if (month === prevMonth) return null
    return format(weeks[weekIndex][0], 'MMM')
  }

  return (
    <div className='overflow-x-auto'>
      {/* Centers the graph within the card when it fits the available
          width; on narrow screens it still scrolls (see overflow-x-auto
          above) rather than clipping or squeezing. */}
      <div className='flex flex-col items-center'>
        <div
          className='grid'
          style={{
            gridTemplateColumns: `${LABEL_COL_PX}px repeat(${weeks.length}, ${CELL_PX}px)`,
            gridTemplateRows: `${MONTH_ROW_PX}px repeat(7, ${CELL_PX}px)`,
            gap: `${GAP_PX}px`,
          }}
        >
          {Object.entries(WEEKDAY_LABELS_TH).map(([dayIndex, label]) => (
            <div
              key={dayIndex}
              style={{ gridColumn: 1, gridRow: Number(dayIndex) + 2 }}
              className='flex items-center text-[10px] text-muted-foreground'
            >
              {label}
            </div>
          ))}

          {weeks.map((week, wi) => {
            const monthLabel = monthLabelForWeek(wi)
            return (
              <Fragment key={wi}>
                {monthLabel && (
                  <div
                    style={{ gridColumn: wi + 2, gridRow: 1 }}
                    className='text-[10px] text-muted-foreground'
                  >
                    {monthLabel}
                  </div>
                )}
                {week.map((day, di) => {
                  const inRange = day >= rangeStart && day <= today
                  const entry = inRange ? getEntry(day) : null
                  const style = { gridColumn: wi + 2, gridRow: di + 2 }

                  const cell = (
                    <div
                      style={style}
                      title={inRange ? format(day, 'd MMMM yyyy') : undefined}
                      className={cn(
                        'rounded-xs',
                        !inRange && 'invisible',
                        inRange && !entry && 'bg-muted',
                        inRange &&
                          entry &&
                          'cursor-pointer bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500',
                        inRange &&
                          isSameDay(day, today) &&
                          'ring-1 ring-green-700 dark:ring-green-300'
                      )}
                    />
                  )

                  if (!entry) {
                    return <Fragment key={di}>{cell}</Fragment>
                  }

                  return (
                    <Popover key={di}>
                      <PopoverTrigger asChild>{cell}</PopoverTrigger>
                      <PopoverContent className='w-64'>
                        <div className='mb-2 flex items-center gap-1.5 text-sm font-medium'>
                          {entry.type === 'text' ? (
                            <TypeIcon className='size-3.5 text-green-600' />
                          ) : (
                            <ImageIcon className='size-3.5 text-green-600' />
                          )}
                          {format(day, 'd MMMM yyyy')}
                        </div>
                        {entry.type === 'text' ? (
                          <p className='text-sm text-muted-foreground'>
                            {entry.content}
                          </p>
                        ) : (
                          entry.imageUrl && (
                            <img
                              src={entry.imageUrl}
                              alt='เฝ้าเดี่ยว'
                              className='w-full rounded-md border object-contain'
                            />
                          )
                        )}
                      </PopoverContent>
                    </Popover>
                  )
                })}
              </Fragment>
            )
          })}
        </div>

        <div className='mt-2 flex items-center gap-3 text-[10px] text-muted-foreground'>
          <span className='flex items-center gap-1'>
            <span className='inline-block size-2.5 rounded-xs bg-green-500 dark:bg-green-600' />
            ส่งแล้ว
          </span>
          <span className='flex items-center gap-1'>
            <span className='bg-muted inline-block size-2.5 rounded-xs' />
            ยังไม่ส่ง
          </span>
        </div>
      </div>
    </div>
  )
}
