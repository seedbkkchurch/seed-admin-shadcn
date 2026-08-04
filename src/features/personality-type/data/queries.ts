import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { type PersonalityTypeRow } from './schema'

const personalityTypeKeys = {
  list: ['personality-type', 'admin-list'] as const,
}

export function usePersonalityTypeList() {
  return useQuery({
    queryKey: personalityTypeKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personality_type')
        .select('code, description_en, description_th, explain, archetype')
        .order('code', { ascending: true })

      if (error) throw error
      return data as PersonalityTypeRow[]
    },
  })
}

type PersonalityTypeInput = PersonalityTypeRow

export function useCreatePersonalityType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: PersonalityTypeInput) => {
      const { data, error } = await supabase
        .from('personality_type')
        .insert(values)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalityTypeKeys.list })
    },
  })
}

export function useUpdatePersonalityType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      code,
      values,
    }: {
      code: string
      values: Omit<PersonalityTypeInput, 'code'>
    }) => {
      const { data, error } = await supabase
        .from('personality_type')
        .update(values)
        .eq('code', code)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalityTypeKeys.list })
    },
  })
}

export function useDeletePersonalityType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('personality_type')
        .delete()
        .eq('code', code)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personalityTypeKeys.list })
    },
  })
}
