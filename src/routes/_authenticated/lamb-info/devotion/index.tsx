import { createFileRoute } from '@tanstack/react-router'
import { DevotionFeed } from '@/features/lamb-info/devotion-feed'

export const Route = createFileRoute('/_authenticated/lamb-info/devotion/')({
  component: DevotionFeed,
})
