'use client'

import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DEFAULT_GIFTS,
  GIFT_CATEGORIES,
  GIFT_SCORE_MAX,
  GIFT_SCORE_MIN,
  getDefaultGiftScores,
  type GiftScores,
} from '../data/gifts'

// Form values are kept as strings (same convention as the other lamb-info
// forms, e.g. Age/Years of Faith) so the <Input type='number'> can bind
// directly without React Hook Form <-> number-type friction. Converted to
// GiftScores (numbers) right before onSave.
type GiftFormValues = Record<string, string>

const scoreSchema = z
  .string()
  .min(1, 'Required.')
  .regex(/^\d+$/, 'Whole numbers only.')
  .refine(
    (v) => Number(v) >= GIFT_SCORE_MIN && Number(v) <= GIFT_SCORE_MAX,
    `Must be ${GIFT_SCORE_MIN}–${GIFT_SCORE_MAX}.`
  )

const formSchema = z.record(z.string(), scoreSchema)

function toFormValues(scores: GiftScores): GiftFormValues {
  return Object.fromEntries(
    Object.entries(scores).map(([name, score]) => [name, String(score)])
  )
}

function toGiftScores(values: GiftFormValues): GiftScores {
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => [name, Number(value)])
  )
}

type GiftsEditSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentScores: GiftScores
  onSave: (scores: GiftScores) => void
}

export function GiftsEditSheet({
  open,
  onOpenChange,
  currentScores,
  onSave,
}: GiftsEditSheetProps) {
  const defaultValues = useMemo(
    () => toFormValues(currentScores),
    [currentScores]
  )

  const form = useForm<GiftFormValues>({
    resolver: zodResolver(formSchema),
    values: defaultValues,
  })

  // Re-sync the form to the latest saved scores whenever the sheet re-opens.
  useEffect(() => {
    if (open) form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = (values: GiftFormValues) => {
    onSave(toGiftScores(values))
    toast.success('Saved gift scores.')
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(state) => {
        form.reset(defaultValues)
        onOpenChange(state)
      }}
    >
      <SheetContent className='sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Edit Gifts from God</SheetTitle>
          <SheetDescription>
            Score each gift from {GIFT_SCORE_MIN} to {GIFT_SCORE_MAX}. Saved
            only in this browser, specific to this lamb.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='gifts-edit-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            {GIFT_CATEGORIES.map((category) => (
              <div key={category}>
                <h4 className='mb-2 text-sm font-semibold'>{category}</h4>
                <div className='space-y-3'>
                  {DEFAULT_GIFTS.filter((g) => g.category === category).map(
                    (gift) => (
                      <FormField
                        key={gift.name}
                        control={form.control}
                        name={gift.name}
                        render={({ field }) => (
                          <FormItem className='flex flex-row items-center justify-between gap-4 space-y-0'>
                            <FormLabel className='flex-1 font-normal'>
                              {gift.name}
                            </FormLabel>
                            <div className='w-20'>
                              <FormControl>
                                <Input
                                  type='number'
                                  inputMode='numeric'
                                  min={GIFT_SCORE_MIN}
                                  max={GIFT_SCORE_MAX}
                                  step={1}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    )
                  )}
                </div>
              </div>
            ))}
          </form>
        </Form>

        <SheetFooter className='flex-row justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => form.reset(toFormValues(getDefaultGiftScores()))}
          >
            Reset to Default
          </Button>
          <Button type='submit' form='gifts-edit-form'>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
