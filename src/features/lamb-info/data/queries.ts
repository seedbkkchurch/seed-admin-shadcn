import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { type LambInfo, type LambInfoRow } from './schema'

const lambInfoKeys = {
  list: ['lamb-info'] as const,
}
const groupCareKeys = {
  list: ['group-care'] as const,
}
const personalityTypeKeys = {
  list: ['personality-type'] as const,
}

export function useLambInfoList() {
  return useQuery({
    queryKey: lambInfoKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lamb_info')
        .select(
          '*, group_care_info:group_care(id, name), personality_type(code, description_en, description_th, explain, archetype)'
        )
        .order('first_name', { ascending: true })

      if (error) throw error
      return data as LambInfoRow[]
    },
  })
}

export function useGroupCareOptions() {
  return useQuery({
    queryKey: groupCareKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_care')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

export function usePersonalityTypeOptions() {
  return useQuery({
    queryKey: personalityTypeKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personality_type')
        .select('code, description_en, description_th, explain, archetype')
        .order('code', { ascending: true })

      if (error) throw error
      return data
    },
  })
}

type LambInfoInput = Omit<LambInfo, 'id'>

export function useCreateLambInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: LambInfoInput) => {
      const { data, error } = await supabase
        .from('lamb_info')
        .insert(values)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list })
    },
  })
}

export function useUpdateLambInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: LambInfoInput
    }) => {
      const { data, error } = await supabase
        .from('lamb_info')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list })
    },
  })
}

export function useDeleteLambInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lamb_info').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lambInfoKeys.list })
    },
  })
}
