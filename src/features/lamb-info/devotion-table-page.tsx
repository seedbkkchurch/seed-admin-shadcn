import { AlertCircle } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { DevotionTable } from './components/devotion-table'
import { useLambDevotionTable } from './data/queries'

// Admin/test view of every row in `lamb_devotion` (public and private) —
// separate from the public-only feed at devotion-feed.tsx. Per grill-me
// follow-up (2026-08-09) — explicitly a testing tool.
export function DevotionTablePage() {
  const { data, isPending, isError, error } = useLambDevotionTable()

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            เฝ้าเดี่ยว (ตารางทดสอบ)
          </h2>
          <p className='text-muted-foreground'>
            รายการเฝ้าเดี่ยวทั้งหมดในตาราง lamb_devotion (รวมที่ตั้งเป็นส่วนตัว) — ใช้สำหรับทดสอบ/เช็คข้อมูล
          </p>
        </div>

        {isError ? (
          <Alert variant='destructive'>
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-8 w-full' />
          </div>
        ) : (
          <DevotionTable data={data} />
        )}
      </Main>
    </>
  )
}
