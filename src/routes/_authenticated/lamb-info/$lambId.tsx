import { createFileRoute } from '@tanstack/react-router'
import { LambInfoProfile } from '@/features/lamb-info/profile'

export const Route = createFileRoute('/_authenticated/lamb-info/$lambId')({
  component: LambInfoProfile,
})
