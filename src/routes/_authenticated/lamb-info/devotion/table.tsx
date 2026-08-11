import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DevotionTablePage } from '@/features/lamb-info/devotion-table-page'

const devotionTableSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  filter: z.string().optional().catch(''),
  is_public: z.array(z.enum(['public', 'private'])).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/lamb-info/devotion/table')(
  {
    validateSearch: devotionTableSearchSchema,
    component: DevotionTablePage,
  }
)
