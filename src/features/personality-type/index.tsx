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
import { usePersonalityTypeList } from './data/queries'
import { PersonalityTypeDialogs } from './components/personality-type-dialogs'
import { PersonalityTypePrimaryButtons } from './components/personality-type-primary-buttons'
import { PersonalityTypeProvider } from './components/personality-type-provider'
import { PersonalityTypeTable } from './components/personality-type-table'

const route = getRouteApi('/_authenticated/personality-type/')

export function PersonalityType() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { data, isPending, isError, error } = usePersonalityTypeList()

  return (
    <PersonalityTypeProvider>
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
              Personality Type
            </h2>
            <p className='text-muted-foreground'>
              Manage the personality types in personality_type here.
            </p>
          </div>
          <PersonalityTypePrimaryButtons />
        </div>
        {isError ? (
          <Alert variant='destructive'>
            <AlertCircle />
            <AlertTitle>Couldn&apos;t load personality_type.</AlertTitle>
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
          <PersonalityTypeTable
            data={data ?? []}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <PersonalityTypeDialogs />
    </PersonalityTypeProvider>
  )
}
