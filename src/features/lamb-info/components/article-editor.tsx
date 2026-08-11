import { useRef, useState } from 'react'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Heading2,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { uploadDevotionImage } from '@/lib/supabase/devotion-image'
import { cn } from '@/lib/utils'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type ArticleEditorProps = {
  placeholder?: string
  // Pre-fills the editor with existing HTML — used by the edit form
  // (devotion-editor.tsx's DevotionEditForm) to load a devotion's current
  // content_html. Only read at mount; the parent only renders
  // ArticleEditor once this value is ready (see DevotionEditForm), so no
  // async re-sync is needed. Omit/undefined for a blank editor (create
  // flow).
  initialContent?: string
  onChangeHtml: (html: string) => void
  // Lets the parent form (devotion-editor.tsx) disable submit while an
  // image is mid-upload, so a still-uploading image never gets left out
  // of what's saved.
  onUploadingChange?: (uploading: boolean) => void
  // Public/private state of the form's toggle *right now* — each inserted
  // image is uploaded to the matching bucket folder at insert time. If the
  // toggle changes afterward, already-inserted images are left where they
  // are (see uploadDevotionImage doc comment).
  isPublic: boolean
  className?: string
}

// Medium-style rich text editor — bold/italic/headings/lists/quote plus
// inline image insertion at the cursor. Images are resized client-side
// (see image-resize.ts) and uploaded to Supabase Storage immediately on
// selection (see devotion-image.ts) — the URL inserted into the editor
// is the real, persisted public URL, not a local object URL.
export function ArticleEditor({
  placeholder,
  initialContent,
  onChangeHtml,
  onUploadingChange,
  isPublic,
  className,
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const editor = useEditor({
    content: initialContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image,
      Placeholder.configure({
        placeholder: placeholder ?? 'เขียนเนื้อหาบทความของคุณที่นี่...',
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[320px] text-sm leading-relaxed focus:outline-none sm:text-base',
          '[&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold',
          '[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold',
          '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6',
          '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6',
          '[&_blockquote]:my-3 [&_blockquote]:border-s-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic',
          '[&_img]:my-4 [&_img]:max-h-[480px] [&_img]:w-full [&_img]:rounded-md [&_img]:object-contain',
          '[&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:float-start [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]'
        ),
      },
    },
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
  })

  const handleImageButtonClick = () => fileInputRef.current?.click()

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น')
      return
    }

    setIsUploading(true)
    onUploadingChange?.(true)
    try {
      const url = await uploadDevotionImage(file, isPublic)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (error) {
      toast.error('อัปโหลดรูปไม่สำเร็จ', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsUploading(false)
      onUploadingChange?.(false)
    }
  }

  if (!editor) return null

  return (
    <div className={cn('rounded-md border', className)}>
      <div className='flex flex-wrap items-center gap-1 border-b p-2'>
        <Button
          type='button'
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label='ตัวหนา'
        >
          <Bold />
        </Button>
        <Button
          type='button'
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label='ตัวเอียง'
        >
          <Italic />
        </Button>
        <Button
          type='button'
          variant={
            editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'
          }
          size='icon'
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label='หัวข้อย่อย'
        >
          <Heading2 />
        </Button>
        <Button
          type='button'
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label='คำคม'
        >
          <Quote />
        </Button>
        <Button
          type='button'
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label='รายการหัวข้อ'
        >
          <List />
        </Button>
        <Button
          type='button'
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size='icon'
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label='รายการลำดับเลข'
        >
          <ListOrdered />
        </Button>

        <Separator orientation='vertical' className='mx-1 h-6' />

        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={handleImageButtonClick}
          disabled={isUploading}
          aria-label='แทรกรูปภาพ'
        >
          {isUploading ? <Loader2 className='animate-spin' /> : <ImageIcon />}
        </Button>
        <input
          ref={fileInputRef}
          type='file'
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleImageChange}
          className='hidden'
        />
      </div>

      <div className='px-4 py-3'>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
