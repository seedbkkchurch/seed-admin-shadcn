import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { GroupCare } from '@/features/group-care'

const groupCareSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  name: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/group-care/')({
  validateSearch: groupCareSearchSchema,
  component: GroupCare,
})
