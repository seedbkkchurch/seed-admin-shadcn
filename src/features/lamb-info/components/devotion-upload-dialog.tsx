import { useState } from 'react'
import { format } from 'date-fns'
import { ImageIcon, Loader2, Type as TypeIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { type DevotionEntry } from '../data/devotions'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type DevotionUploadDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  today: Date
  // Only ever updates local, in-memory state (see devotion-section.tsx) —
  // there is no lamb_devotion table yet, so nothing here is persisted.
  onSubmit: (entry: DevotionEntry) => void
}

export function DevotionUploadDialog({
  open,
  onOpenChange,
  today,
  onSubmit,
}: DevotionUploadDialogProps) {
  const [tab, setTab] = useState<'text' | 'image'>('text')
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setTab('text')
    setText('')
    setImageFile(null)
    setImagePreviewUrl(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น')
      return
    }
    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const canSubmit =
    tab === 'text' ? text.trim().length > 0 : imageFile !== null

  const handleSubmit = () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    const dateKey = format(today, 'yyyy-MM-dd')
    const entry: DevotionEntry =
      tab === 'text'
        ? { date: dateKey, type: 'text', content: text.trim(), imageUrl: null }
        : {
            date: dateKey,
            type: 'image',
            content: null,
            imageUrl: imagePreviewUrl,
          }

    onSubmit(entry)
    toast.success('บันทึกเฝ้าเดี่ยววันนี้แล้ว', {
      description: 'ตัวอย่าง UI เท่านั้น — ยังไม่เชื่อมระบบจริง ข้อมูลจะหายเมื่อรีเฟรชหน้า',
    })
    setIsSubmitting(false)
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>ส่งเฝ้าเดี่ยววันนี้</DialogTitle>
          <DialogDescription>
            {format(today, 'd MMMM yyyy')} — เลือกส่งเป็นข้อความหรือรูปภาพ
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value='text'>
              <TypeIcon /> พิมพ์ข้อความ
            </TabsTrigger>
            <TabsTrigger value='image'>
              <ImageIcon /> อัปโหลดรูป
            </TabsTrigger>
          </TabsList>

          <TabsContent value='text' className='mt-2'>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='เขียนสิ่งที่ได้รับจากการเฝ้าเดี่ยววันนี้...'
              rows={6}
              autoFocus
            />
          </TabsContent>

          <TabsContent value='image' className='mt-2 space-y-3'>
            <input
              type='file'
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={handleImageChange}
              className='text-sm'
            />
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt='ตัวอย่างรูปเฝ้าเดี่ยว'
                className='max-h-64 w-full rounded-md border object-contain'
              />
            )}
          </TabsContent>
        </Tabs>

        <p className='text-muted-foreground text-xs'>
          ฟีเจอร์นี้ยังเป็นตัวอย่าง UI เท่านั้น — ยังไม่บันทึกลงฐานข้อมูลจริง
        </p>

        <DialogFooter>
          <Button variant='outline' onClick={() => handleOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className='animate-spin' />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
