import { createFileRoute } from '@tanstack/react-router'
import { LambDevotionTablePage } from '@/features/lamb-info/lamb-devotion-table-page'

export const Route = createFileRoute(
  '/_authenticated/lamb-info/$lambId/devotion'
)({
  component: LambDevotionTablePage,
})
