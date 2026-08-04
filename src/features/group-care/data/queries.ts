import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { type GroupCareRow } from './schema'

const groupCareKeys = {
  list: ['group-care', 'admin-list'] as const,
}

export function useGroupCareList() {
  return useQuery({
    queryKey: groupCareKeys.list,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_care')
        .select('id, name, address, day')
        .order('name', { ascending: true })

      if (error) throw error
      return data as GroupCareRow[]
    },
  })
}

type GroupCareInput = Omit<GroupCareRow, 'id'>

export function useCreateGroupCare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: GroupCareInput) => {
      const { data, error } = await supabase
        .from('group_care')
        .insert(values)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list })
    },
  })
}

export function useUpdateGroupCare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: GroupCareInput
    }) => {
      const { data, error } = await supabase
        .from('group_care')
        .update(values)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list })
    },
  })
}

export function useDeleteGroupCare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('group_care').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupCareKeys.list })
    },
  })
}
