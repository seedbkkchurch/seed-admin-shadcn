'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteLambDevotions } from '../data/queries'
import { type LambDevotionRow } from '../data/devotion-schema'

type DevotionTableMultiDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<LambDevotionRow>
}

const CONFIRM_WORD = 'DELETE'

export function DevotionTableMultiDeleteDialog({
  open,
  onOpenChange,
  table,
}: DevotionTableMultiDeleteDialogProps) {
  const [value, setValue] = useState('')
  const deleteDevotions = useDeleteLambDevotions()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`พิมพ์ "${CONFIRM_WORD}" เพื่อยืนยัน`)
      return
    }

    try {
      await deleteDevotions.mutateAsync(
        selectedRows.map((row) => row.original.id)
      )
      toast.success(`ลบ ${selectedRows.length} รายการแล้ว`)
      setValue('')
      table.resetRowSelection()
      onOpenChange(false)
    } catch (error) {
      toast.error('ลบไม่สำเร็จ', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='devotion-multi-delete-form'
      disabled={value.trim() !== CONFIRM_WORD || deleteDevotions.isPending}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          ลบเฝ้าเดี่ยว {selectedRows.length} รายการ
        </span>
      }
      desc={
        <form
          id='devotion-multi-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            void handleDelete()
          }}
          className='space-y-4'
        >
          <p className='mb-2'>
            ต้องการลบเฝ้าเดี่ยวที่เลือกไว้ทั้งหมดใช่หรือไม่? การกระทำนี้ย้อนกลับไม่ได้
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span>พิมพ์ &quot;{CONFIRM_WORD}&quot; เพื่อยืนยัน:</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`พิมพ์ "${CONFIRM_WORD}"`}
              autoFocus
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>คำเตือน!</AlertTitle>
            <AlertDescription>
              ข้อมูลที่ลบแล้วไม่สามารถกู้คืนได้
            </AlertDescription>
          </Alert>
        </form>
      }
      confirmText='ลบ'
      destructive
    />
  )
}
