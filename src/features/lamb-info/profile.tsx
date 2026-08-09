import { type ReactNode } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { AlertCircle, ArrowLeft, UserPen } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { AvatarUpload } from '@/components/avatar-upload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getTagColorClass } from '@/lib/tag-color'
import { cn } from '@/lib/utils'
import { useLambInfoDetail, useUpdateLambInfo } from './data/queries'
import { type LambInfoRow } from './data/schema'
import { DevotionSection } from './components/devotion-section'
import { GiftsCard } from './components/gifts-card'
import { GrowthProgressCard } from './components/growth-progress-card'
import { LambInfoDialogs } from './components/lamb-info-dialogs'
import { LambInfoProvider, useLambInfo } from './components/lamb-info-provider'

const route = getRouteApi('/_authenticated/lamb-info/$lambId')

function getInitials(row: LambInfoRow) {
  const source = row.nick_name || row.first_name || '?'
  return source.slice(0, 2).toUpperCase()
}

function InfoField({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='mt-1 text-sm'>
        {value === null || value === undefined || value === '' ? (
          <span className='text-muted-foreground italic'>-</span>
        ) : (
          value
        )}
      </div>
    </div>
  )
}

function ProfileHeader({ row }: { row: LambInfoRow }) {
  const { setOpen, setCurrentRow } = useLambInfo()
  const updateLambInfo = useUpdateLambInfo()
  const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ')

  const groupName = row.group_care_info?.name

  const handleAvatarUploaded = (url: string) => {
    updateLambInfo.mutate({
      id: row.id,
      values: {
        profile_picture: url,
        nick_name: row.nick_name,
        first_name: row.first_name,
        last_name: row.last_name,
        gender: row.gender,
        address: row.address,
        email: row.email,
        phone: row.phone,
        birthday: row.birthday,
        job: row.job,
        interesting: row.interesting,
        favorite_food: row.favorite_food,
        unfavorite_food: row.unfavorite_food,
        is_timote: row.is_timote,
        status: row.status,
        group_care: row.group_care,
        age: row.age,
        years_of_faith: row.years_of_faith,
        remark: row.remark,
        previous_church: row.previous_church,
        personality_code: row.personality_code,
        tags: row.tags,
      },
    })
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex items-center gap-6'>
        <AvatarUpload
          mode='immediate'
          className='size-[125px]'
          imageUrl={row.profile_picture}
          initials={getInitials(row)}
          nickname={row.nick_name || row.first_name || 'avatar'}
          lambId={row.id}
          onUploaded={handleAvatarUploaded}
        />
        <div>
          <div className='flex flex-wrap items-center gap-3'>
            <h2 className='text-5xl font-bold tracking-tight'>
              {row.nick_name || fullName}
            </h2>
            <Badge
              variant='outline'
              className={cn(
                'px-3 py-1 text-sm capitalize',
                row.status
                  ? 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'
                  : 'bg-neutral-300/40 border-neutral-300'
              )}
            >
              {row.status ? 'Active' : 'Inactive'}
            </Badge>
            {row.tags && (
              <Badge
                variant='outline'
                className={cn('px-3 py-1 text-sm', getTagColorClass(row.tags))}
              >
                {row.tags}
              </Badge>
            )}
            {groupName ? (
              <Badge
                variant='outline'
                className={cn(
                  'px-3 py-1 text-sm',
                  getTagColorClass(groupName)
                )}
              >
                {groupName}
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='bg-neutral-300/40 border-neutral-300 px-3 py-1 text-sm'
              >
                ไม่มีกลุ่ม
              </Badge>
            )}
          </div>
          <p className='text-muted-foreground text-lg'>{fullName}</p>
        </div>
      </div>
      <Button
        onClick={() => {
          setCurrentRow(row)
          setOpen('edit')
        }}
      >
        <UserPen /> Edit
      </Button>
    </div>
  )
}

function GeneralInfoCard({ row }: { row: LambInfoRow }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลทั่วไป</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <InfoField label='Nickname' value={row.nick_name} />
        <InfoField
          label='Full Name'
          value={[row.first_name, row.last_name].filter(Boolean).join(' ')}
        />
        <InfoField label='Gender' value={row.gender} />
        <InfoField
          label='Birthday'
          value={
            row.birthday ? format(new Date(row.birthday), 'd MMM yyyy') : null
          }
        />
        <InfoField label='Age' value={row.age} />
        <InfoField label='Job' value={row.job} />
        <InfoField label='Email' value={row.email} />
        <InfoField label='Phone' value={row.phone} />
        <InfoField label='Group' value={row.group_care_info?.name} />
        <InfoField label='Interesting' value={row.interesting} />
        <InfoField label='อาหารที่ชอบ' value={row.favorite_food} />
        <InfoField label='อาหารที่ไม่ชอบ' value={row.unfavorite_food} />
        <InfoField label='Address' value={row.address} />
      </CardContent>
    </Card>
  )
}

function SpiritualInfoCard({ row }: { row: LambInfoRow }) {
  const personality = row.personality_type
  return (
    <Card>
      <CardHeader>
        <CardTitle>ข้อมูลฝ่ายจิตวิญญาณ</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <InfoField label='Years of Faith' value={row.years_of_faith} />
        <InfoField
          label='Is Timote'
          value={row.is_timote == null ? null : row.is_timote ? 'Yes' : 'No'}
        />
        <InfoField
          label='Personality'
          value={
            personality
              ? personality.description_th
                ? `${personality.code} — ${personality.description_th}`
                : personality.code
              : null
          }
        />
        <InfoField label='Previous Church' value={row.previous_church} />
        <InfoField label='Remark' value={row.remark} />
      </CardContent>
    </Card>
  )
}

function ProfileContent({ row }: { row: LambInfoRow }) {
  return (
    <div className='flex flex-1 flex-col gap-4 sm:gap-6'>
      <div>
        <Button variant='ghost' size='sm' asChild className='-ms-2 mb-2'>
          <Link to='/lamb-info'>
            <ArrowLeft /> Back to Lamb Info
          </Link>
        </Button>
        <ProfileHeader row={row} />
      </div>
      <GeneralInfoCard row={row} />
      <SpiritualInfoCard row={row} />
      <GrowthProgressCard
        chapterProgress={row.lamb_lesson_ch18_progress ?? null}
      />
      <GiftsCard key={row.id} lambId={row.id} />
      <DevotionSection key={row.id} lambId={row.id} />
    </div>
  )
}

export function LambInfoProfile() {
  const { lambId } = route.useParams()
  const { data, isPending, isError, error } = useLambInfoDetail(lambId)

  return (
    <LambInfoProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {isError ? (
          <Alert variant='destructive'>
            <AlertCircle />
            <AlertTitle>Couldn&apos;t load this profile.</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Something went wrong.'}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className='space-y-2'>
            <Skeleton className='h-8 w-full' />
            <Skeleton className='h-40 w-full' />
            <Skeleton className='h-40 w-full' />
          </div>
        ) : (
          <ProfileContent row={data} />
        )}
      </Main>

      <LambInfoDialogs />
    </LambInfoProvider>
  )
}
