import { z } from 'zod'

export const groupCareSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable(),
  day: z.string().nullable(),
})
export type GroupCareRow = z.infer<typeof groupCareSchema>
