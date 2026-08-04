'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteGroupCare } from '../data/queries'
import { type GroupCareRow } from '../data/schema'

type GroupCareDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: GroupCareRow
}

export function GroupCareDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: GroupCareDeleteDialogProps) {
  const [value, setValue] = useState('')
  const deleteGroupCare = useDeleteGroupCare()

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return

    try {
      await deleteGroupCare.mutateAsync(currentRow.id)
      toast.success('Group care deleted.')
      onOpenChange(false)
    } catch {
      // Errors surface via the global mutation error handler (toast).
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='group-care-delete-form'
      disabled={value.trim() !== currentRow.name || deleteGroupCare.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete Group Care
        </span>
      }
      desc={
        <form
          id='group-care-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            void handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            Are you sure you want to delete{' '}
            <span className='font-bold'>{currentRow.name}</span>? This will
            permanently remove the record. This cannot be undone.
          </p>

          <Label className='my-2'>
            Name:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Type the group name to confirm deletion.'
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
