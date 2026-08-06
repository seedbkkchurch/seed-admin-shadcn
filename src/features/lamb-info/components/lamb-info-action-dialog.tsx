'use client'

import { useEffect } from 'react'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { DatePicker } from '@/components/date-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import {
  useCreateLambInfo,
  useGroupCareOptions,
  usePersonalityTypeOptions,
  useUpdateLambInfo,
} from '../data/queries'
import { type LambInfoRow } from '../data/schema'

const formSchema = z.object({
  profile_picture: z
    .union([z.url({ error: 'Enter a valid URL.' }), z.literal('')])
    .optional(),
  nick_name: z.string().optional(),
  first_name: z.string().min(1, 'First name is required.'),
  last_name: z.string().min(1, 'Last name is required.'),
  gender: z.string().optional(),
  address: z.string().optional(),
  email: z
    .union([z.email({ error: 'Enter a valid email.' }), z.literal('')])
    .optional(),
  phone: z.string().optional(),
  birthday: z.date().optional(),
  job: z.string().optional(),
  interesting: z.string().optional(),
  is_timote: z.boolean(),
  status: z.boolean(),
  group_care: z.string().optional(),
  age: z.string().optional(),
  years_of_faith: z.string().optional(),
  remark: z.string().optional(),
  previous_church: z.string().optional(),
  personality_code: z.string().optional(),
  tags: z.string().optional(),
})
type LambInfoForm = z.infer<typeof formSchema>

type LambInfoActionDialogProps = {
  currentRow?: LambInfoRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toDefaultValues(currentRow?: LambInfoRow): LambInfoForm {
  if (!currentRow) {
    return {
      profile_picture: '',
      nick_name: '',
      first_name: '',
      last_name: '',
      gender: '',
      address: '',
      email: '',
      phone: '',
      birthday: undefined,
      job: '',
      interesting: '',
      is_timote: false,
      status: true,
      group_care: '',
      age: '',
      years_of_faith: '',
      remark: '',
      previous_church: '',
      personality_code: '',
      tags: '',
    }
  }
  return {
    profile_picture: currentRow.profile_picture ?? '',
    nick_name: currentRow.nick_name ?? '',
    first_name: currentRow.first_name ?? '',
    last_name: currentRow.last_name ?? '',
    gender: currentRow.gender ?? '',
    address: currentRow.address ?? '',
    email: currentRow.email ?? '',
    phone: currentRow.phone ?? '',
    birthday: currentRow.birthday ? new Date(currentRow.birthday) : undefined,
    job: currentRow.job ?? '',
    interesting: currentRow.interesting ?? '',
    is_timote: currentRow.is_timote ?? false,
    status: currentRow.status ?? true,
    group_care: currentRow.group_care ?? '',
    age: currentRow.age != null ? String(currentRow.age) : '',
    years_of_faith:
      currentRow.years_of_faith != null
        ? String(currentRow.years_of_faith)
        : '',
    remark: currentRow.remark ?? '',
    previous_church: currentRow.previous_church ?? '',
    personality_code: currentRow.personality_code ?? '',
    tags: currentRow.tags ?? '',
  }
}

export function LambInfoActionDialog({
  currentRow,
  open,
  onOpenChange,
}: LambInfoActionDialogProps) {
  const isEdit = !!currentRow
  const { data: groupOptions, isPending: isGroupPending } =
    useGroupCareOptions()
  const { data: personalityOptions, isPending: isPersonalityPending } =
    usePersonalityTypeOptions()
  const createLambInfo = useCreateLambInfo()
  const updateLambInfo = useUpdateLambInfo()

  const form = useForm<LambInfoForm>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaultValues(currentRow),
  })

  // Re-sync the form whenever the row being edited changes.
  useEffect(() => {
    form.reset(toDefaultValues(currentRow))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRow])

  const isSubmitting = createLambInfo.isPending || updateLambInfo.isPending

  const onSubmit = async (values: LambInfoForm) => {
    const payload = {
      profile_picture: values.profile_picture || null,
      nick_name: values.nick_name || null,
      first_name: values.first_name,
      last_name: values.last_name,
      gender: values.gender || null,
      address: values.address || null,
      email: values.email || null,
      phone: values.phone || null,
      birthday: values.birthday ? format(values.birthday, 'yyyy-MM-dd') : null,
      job: values.job || null,
      interesting: values.interesting || null,
      is_timote: values.is_timote,
      status: values.status,
      group_care: values.group_care || null,
      age: values.age ? Number(values.age) : null,
      years_of_faith: values.years_of_faith
        ? Number(values.years_of_faith)
        : null,
      remark: values.remark || null,
      previous_church: values.previous_church || null,
      personality_code: values.personality_code || null,
      tags: values.tags || null,
    }

    try {
      if (isEdit) {
        await updateLambInfo.mutateAsync({ id: currentRow.id, values: payload })
        toast.success('Lamb info updated.')
      } else {
        await createLambInfo.mutateAsync(payload)
        toast.success('Lamb info created.')
      }
      form.reset()
      onOpenChange(false)
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit Lamb Info' : 'Add Lamb Info'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the record here. ' : 'Create a new record here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='h-105 w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='lamb-info-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='profile_picture'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Profile Picture URL
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='nick_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Nickname
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='first_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='last_name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='gender'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Gender</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Address
                    </FormLabel>
                    <FormControl>
                      <Textarea className='col-span-4' rows={2} {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Email</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Phone</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='birthday'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Birthday
                    </FormLabel>
                    <div className='col-span-4'>
                      <DatePicker
                        selected={field.value}
                        onSelect={field.onChange}
                        placeholder='Pick a birthday'
                      />
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='job'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Job</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='interesting'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Interesting
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='age'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Age</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='years_of_faith'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Years of Faith
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='group_care'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Group</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a group'
                      className='col-span-4'
                      isPending={isGroupPending}
                      items={(groupOptions ?? []).map((g) => ({
                        label: g.name ?? g.id,
                        value: g.id,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='personality_code'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Personality
                    </FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select a personality type'
                      className='col-span-4'
                      isPending={isPersonalityPending}
                      items={(personalityOptions ?? []).map((p) => ({
                        label: p.description_th
                          ? `${p.code} — ${p.description_th}`
                          : p.code,
                        value: p.code,
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='previous_church'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Previous Church
                    </FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tags'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Tags</FormLabel>
                    <FormControl>
                      <Input className='col-span-4' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Remark
                    </FormLabel>
                    <FormControl>
                      <Textarea className='col-span-4' rows={2} {...field} />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='is_timote'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Is Timote
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='col-span-4 justify-self-start'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Active
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='col-span-4 justify-self-start'
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='lamb-info-form' disabled={isSubmitting}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
