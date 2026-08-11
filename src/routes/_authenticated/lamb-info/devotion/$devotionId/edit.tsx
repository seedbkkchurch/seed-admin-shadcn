import { createFileRoute } from '@tanstack/react-router'
import { DevotionEditForm } from '@/features/lamb-info/devotion-editor'

export const Route = createFileRoute(
  '/_authenticated/lamb-info/devotion/$devotionId/edit'
)({
  component: DevotionEditForm,
})
