import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { type GiftFromGodRow, type GiftScores } from './gifts'
import { type LambInfo, type LambInfoRow } from './schema'

const lambInfoKeys = {
  list: ['lamb-info'] as const,
  detail: (id: string) => ['lamb-info', id] as const,
}
const groupCareKeys = {
  list: ['group-care'] as const,
}
const personalityTypeKeys = {
  list: ['personality-type'] as const,
}
const giftFromGodKeys = {
  detail: (lambId: string) => ['gift-from-god', lambId] as const,
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
        .order('status', { ascending: false })
        .order('first_name', { ascending: true })

      if (error) throw error
      return data as LambInfoRow[]
    },
  })
}

export function useLambInfoDetail(id: string | undefined) {
  return useQuery({
    queryKey: lambInfoKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lamb_info')
        .select(
          '*, group_care_info:group_care(id, name), personality_type(code, description_en, description_th, explain, archetype)'
        )
        .eq('id', id as string)
        .single()

      if (error) throw error
      return data as LambInfoRow
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

// `gift_from_god` has at most one row per lamb (lamb_id is the PK). A lamb
// with no assessment yet simply has no row — that's expected, not an
// error, and callers should treat a null result as all-zero scores
// (see mergeGiftScores in ./gifts).
export function useGiftFromGod(lambId: string | undefined) {
  return useQuery({
    queryKey: giftFromGodKeys.detail(lambId ?? ''),
    enabled: !!lambId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_from_god')
        .select('*')
        .eq('lamb_id', lambId as string)
        .maybeSingle()

      if (error) throw error
      return data as GiftFromGodRow | null
    },
  })
}

export function useUpsertGiftFromGod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      lambId,
      values,
    }: {
      lambId: string
      values: GiftScores
    }) => {
      const { data, error } = await supabase
        .from('gift_from_god')
        .upsert({ lamb_id: lambId, ...values }, { onConflict: 'lamb_id' })
        .select()
        .single()

      if (error) throw error
      return data as GiftFromGodRow
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: giftFromGodKeys.detail(variables.lambId),
      })
    },
  })
}
