import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { LambInfo } from '@/features/lamb-info'

const lambInfoSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  nickName: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/lamb-info/')({
  validateSearch: lambInfoSearchSchema,
  component: LambInfo,
})
