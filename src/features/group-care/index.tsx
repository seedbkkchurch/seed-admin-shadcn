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
import { useGroupCareList } from './data/queries'
import { GroupCareDialogs } from './components/group-care-dialogs'
import { GroupCarePrimaryButtons } from './components/group-care-primary-buttons'
import { GroupCareProvider } from './components/group-care-provider'
import { GroupCareTable } from './components/group-care-table'

const route = getRouteApi('/_authenticated/group-care/')

export function GroupCare() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, error } = useGroupCareList()

  return (
    <GroupCareProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Group Care</h2>
            <p className='text-muted-foreground'>
              Manage the care groups in group_care here.
            </p>
          </div>
          <GroupCarePrimaryButtons />
        </div>
        {isError ? (
          <Alert variant='destructive'>
            <AlertCircle />
            <AlertTitle>Couldn&apos;t load group_care.</AlertTitle>
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
          <GroupCareTable data={data ?? []} search={search} navigate={navigate} />
        )}
      </Main>

      <GroupCareDialogs />
    </GroupCareProvider>
  )
}
