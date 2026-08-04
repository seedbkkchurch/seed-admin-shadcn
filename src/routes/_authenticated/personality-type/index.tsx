import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { PersonalityType } from '@/features/personality-type'

const personalityTypeSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  code: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/personality-type/')({
  validateSearch: personalityTypeSearchSchema,
  component: PersonalityType,
})
