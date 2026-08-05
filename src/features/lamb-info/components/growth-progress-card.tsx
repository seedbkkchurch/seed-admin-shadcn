import { useState } from 'react'
import { CircleCheckBig, HandHeart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { GROWTH_LESSONS } from '../data/lessons'

// This card has no backing table yet — `lamb_info` doesn't track lesson
// completion, ministry role, or start date. The checklist below is
// interactive for preview purposes only; state is local to this component
// and is never persisted or loaded from the server. Once a growth-progress
// data model exists, replace the local `checked` state and the ministry
// placeholders with real queries/mutations.
export function GrowthProgressCard() {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const toggleLesson = (id: number) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress การเติบโต</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div>
          <div className='mb-3 flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2 font-medium'>
              <CircleCheckBig className='size-4 text-teal-600' />
              บทเรียนที่ศึกษาแล้ว
            </div>
            <span className='text-xs text-muted-foreground'>
              ยังไม่เชื่อมข้อมูล — ใช้งานได้ชั่วคราว
            </span>
          </div>
          <div className='rounded-lg bg-teal-50/60 p-4 dark:bg-teal-950/20'>
            <div className='grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2'>
              {GROWTH_LESSONS.map((lesson) => {
                const isChecked = !!checked[lesson.id]
                return (
                  <label
                    key={lesson.id}
                    className='flex cursor-pointer items-center gap-2 py-0.5 text-sm'
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleLesson(lesson.id)}
                      className='data-[state=checked]:border-teal-600 data-[state=checked]:bg-teal-600 dark:data-[state=checked]:bg-teal-600'
                    />
                    <span
                      className={cn(
                        isChecked &&
                          'text-teal-700 line-through dark:text-teal-400'
                      )}
                    >
                      บทที่ {lesson.id}: {lesson.title}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <div className='mb-3 flex items-center gap-2 font-medium'>
            <HandHeart className='size-4 text-teal-600' />
            การเริ่มรับใช้ (ถ้ามี)
          </div>
          <div className='grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2'>
            <div>
              <div className='text-xs text-muted-foreground'>
                ตำแหน่งที่รับใช้
              </div>
              <div className='mt-1 text-sm text-muted-foreground italic'>
                ยังไม่มีข้อมูล
              </div>
            </div>
            <div>
              <div className='text-xs text-muted-foreground'>
                วันที่เริ่มรับใช้
              </div>
              <div className='mt-1 text-sm text-muted-foreground italic'>
                ยังไม่มีข้อมูล
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
