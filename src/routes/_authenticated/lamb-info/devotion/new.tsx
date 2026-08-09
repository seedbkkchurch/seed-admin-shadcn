import { createFileRoute } from '@tanstack/react-router'
import { DevotionEditor } from '@/features/lamb-info/devotion-editor'

export const Route = createFileRoute('/_authenticated/lamb-info/devotion/new')(
  {
    component: DevotionEditor,
  }
)
