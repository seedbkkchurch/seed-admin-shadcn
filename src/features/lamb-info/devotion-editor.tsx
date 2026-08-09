import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArticleEditor } from './components/article-editor'

// Medium-style เฝ้าเดี่ยว (daily devotion) writer — a title plus a rich
// text body that can have images inserted inline, submitted with a single
// button. This does not persist anywhere yet: there is no
// `lamb_devotion` table, so submitting just shows a success toast and
// returns to the lamb-info list (see devotion-section.tsx for the
// existing text/image dialog this is meant to eventually replace — not
// wired up yet, per grill-me follow-up 2026-08-09).
export function DevotionEditor() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [html, setHtml] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEmptyHtml = (value: string) =>
    value.trim().length === 0 || value === '<p></p>'

  const canSubmit = title.trim().length > 0 && !isEmptyHtml(html)

  const handleSubmit = () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    toast.success('ส่งเฝ้าเดี่ยววันนี้แล้ว', {
      description: 'ตัวอย่าง UI เท่านั้น — ยังไม่เชื่อมระบบจริง ข้อมูลจะหายเมื่อรีเฟรชหน้า',
    })
    setIsSubmitting(false)
    navigate({ to: '/lamb-info' })
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              เขียนเฝ้าเดี่ยววันนี้
            </h2>
            <p className='text-muted-foreground'>
              {format(new Date(), 'd MMMM yyyy')} — เขียนบทความ แทรกรูปภาพ
              กลางเนื้อหาได้เหมือน Medium
            </p>
          </div>
          <Button
            size='lg'
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            <Send /> ส่งเฝ้าเดี่ยว
          </Button>
        </div>

        <div className='mx-auto w-full max-w-3xl space-y-4'>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='หัวข้อบทความ...'
            className='h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0 md:text-4xl'
          />

          <ArticleEditor onChangeHtml={setHtml} />
        </div>
      </Main>
    </>
  )
}
