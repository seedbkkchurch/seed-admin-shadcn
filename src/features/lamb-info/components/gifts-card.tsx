import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGiftRadarData, mergeGiftScores, type GiftScores } from '../data/gifts'
import { useGiftFromGod, useUpsertGiftFromGod } from '../data/queries'
import { GiftsEditSheet } from './gifts-edit-sheet'

// Backed by the `gift_from_god` Supabase table — see data/gifts.ts and
// data/queries.ts. A lamb with no row yet shows all-zero scores.
const GIFT_COLOR = '#7c6ff0'

type GiftsCardProps = {
  lambId: string
}

export function GiftsCard({ lambId }: GiftsCardProps) {
  const { data: giftRow, isPending, isError } = useGiftFromGod(lambId)
  const upsertGiftFromGod = useUpsertGiftFromGod()
  const [editOpen, setEditOpen] = useState(false)

  const gifts = useMemo(() => mergeGiftScores(giftRow), [giftRow])
  const radarData = useMemo(() => getGiftRadarData(gifts), [gifts])
  const currentScores = useMemo(
    () => Object.fromEntries(gifts.map((g) => [g.column, g.score])),
    [gifts]
  )

  const handleSave = (values: GiftScores) => {
    upsertGiftFromGod.mutate({ lambId, values })
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <div className='font-semibold'>Gifts from God</div>
          <p className='text-sm text-muted-foreground'>
            Spiritual gifts assessment
          </p>
        </div>
        <CardAction>
          <Button
            variant='ghost'
            size='icon'
            aria-label='Edit gifts'
            onClick={() => setEditOpen(true)}
            disabled={isPending || isError}
          >
            <Pencil className='size-4' />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className='h-[340px] w-full' />
        ) : isError ? (
          <p className='text-sm text-destructive'>
            โหลดข้อมูลของประทานไม่สำเร็จ
          </p>
        ) : (
          <Tabs defaultValue='radar'>
            <TabsList>
              <TabsTrigger value='radar'>Radar Chart</TabsTrigger>
              <TabsTrigger value='detailed'>Detailed View</TabsTrigger>
            </TabsList>

            <TabsContent value='radar'>
              <ResponsiveContainer width='100%' height={340}>
                <RadarChart data={radarData} outerRadius='75%'>
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey='category'
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <Radar
                    name='Gifts'
                    dataKey='score'
                    stroke={GIFT_COLOR}
                    fill={GIFT_COLOR}
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className='mt-2 flex items-center justify-center gap-2 text-sm'>
                <span
                  className='inline-block size-2.5 rounded-xs'
                  style={{ backgroundColor: GIFT_COLOR }}
                />
                <span style={{ color: GIFT_COLOR }}>Gifts</span>
              </div>
            </TabsContent>

            <TabsContent value='detailed'>
              <ResponsiveContainer width='100%' height={gifts.length * 26}>
                <BarChart
                  data={gifts}
                  layout='vertical'
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid horizontal={false} strokeOpacity={0.3} />
                  <XAxis type='number' domain={[0, 15]} fontSize={12} />
                  <YAxis
                    type='category'
                    dataKey='name'
                    width={160}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Bar dataKey='score' fill={GIFT_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <GiftsEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        currentScores={currentScores}
        onSave={handleSave}
      />
    </Card>
  )
}
