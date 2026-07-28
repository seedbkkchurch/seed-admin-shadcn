import { getRouteApi } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useLambInfoList } from './data/queries'
import { LambInfoDialogs } from './components/lamb-info-dialogs'
import { LambInfoPrimaryButtons } from './components/lamb-info-primary-buttons'
import { LambInfoProvider } from './components/lamb-info-provider'
import { LambInfoTable } from './components/lamb-info-table'

const route = getRouteApi('/_authenticated/lamb-info/')

export function LambInfo() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, error } = useLambInfoList()

  return (
    <LambInfoProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Lamb Info</h2>
            <p className='text-muted-foreground'>
              Manage the members in lamb_info here.
            </p>
          </div>
          <LambInfoPrimaryButtons />
        </div>
        {isError ? (
          <Alert variant='destructive'>
            <AlertCircle />
            <AlertTitle>Couldn&apos;t load lamb_info.</AlertTitle>
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
          <LambInfoTable data={data ?? []} search={search} navigate={navigate} />
        )}
      </Main>

      <LambInfoDialogs />
    </LambInfoProvider>
  )
}
