'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeletePersonalityType } from '../data/queries'
import { type PersonalityTypeRow } from '../data/schema'

type PersonalityTypeDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: PersonalityTypeRow
}

export function PersonalityTypeDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: PersonalityTypeDeleteDialogProps) {
  const [value, setValue] = useState('')
  const deletePersonalityType = useDeletePersonalityType()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.code) return

    try {
      await deletePersonalityType.mutateAsync(currentRow.code)
      toast.success('Personality type deleted.')
      onOpenChange(false)
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='personality-type-delete-form'
      disabled={
        value.trim() !== currentRow.code || deletePersonalityType.isPending
      }
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Personality Type
        </span>
      }
      desc={
        <form
          id='personality-type-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            void handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.code}</span>? This will
            permanently remove the record. This cannot be undone.
          </p>

          <Label className='my-2'>
            Code:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Type the code to confirm deletion.'
              autoFocus
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='Delete'
      destructive
    />
  )
}
