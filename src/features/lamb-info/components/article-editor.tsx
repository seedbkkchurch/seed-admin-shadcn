import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Baseline,
  Bold,
  Code,
  Heading2,
  Highlighter,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { uploadDevotionImage } from "@/lib/supabase/devotion-image";
import { cn } from "@/lib/utils";
import { DEVOTION_CONTENT_CLASS } from "../lib/devotion-content-class";
import { DEVOTION_CONTENT_COLOR_SWATCHES } from "../lib/devotion-content-colors";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ArticleEditorProps = {
  placeholder?: string;
  // Pre-fills the editor with existing HTML — used by the edit form
  // (devotion-editor.tsx's DevotionEditForm) to load a devotion's current
  // content_html. Only read at mount; the parent only renders
  // ArticleEditor once this value is ready (see DevotionEditForm), so no
  // async re-sync is needed. Omit/undefined for a blank editor (create
  // flow).
  initialContent?: string;
  onChangeHtml: (html: string) => void;
  // Lets the parent form (devotion-editor.tsx) disable submit while an
  // image is mid-upload, so a still-uploading image never gets left out
  // of what's saved.
  onUploadingChange?: (uploading: boolean) => void;
  // Public/private state of the form's toggle *right now* — each inserted
  // image is uploaded to the matching bucket folder at insert time. If the
  // toggle changes afterward, already-inserted images are left where they
  // are (see uploadDevotionImage doc comment).
  isPublic: boolean;
  className?: string;
};

// Imperative handle เปิดให้ parent (devotion-editor.tsx) แทรก HTML เข้า
// editor ได้จากภายนอก โดยไม่ต้องเปลี่ยน flow onChangeHtml เดิม — ใช้กับ
// ปุ่ม "แทรกข้อที่เลือก" ใน BibleQuickReferenceSheet (ดู grill-me
// 2026-08-13 "เอา bible ไปใช้กับตอนเขียนเฝ้าเดี่ยว")
export type ArticleEditorHandle = {
  insertHtml: (html: string) => void;
};

// ปุ่มจานสี ใช้ร่วมกันทั้ง Color (สีตัวอักษร) และ Highlight (สีเน้นข้อความ)
// — popover เดียวกัน ต่างกันแค่ apply/clear/isActive ที่ parent ส่งเข้ามา
// (ตกลงใน grill-me 2026-08-25 ให้ทั้งสองปุ่มมี UI แบบเดียวกัน คือจานสี
// พรีเซ็ต 8 สีเหมือนกัน + ปุ่ม "เอาสีออก")
type ColorPopoverButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  ariaLabel: string;
  activeColor: string | undefined;
  isActive: boolean;
  onPick: (color: string) => void;
  onClear: () => void;
};

function ColorPopoverButton({
  icon: Icon,
  ariaLabel,
  activeColor,
  isActive,
  onPick,
  onClear,
}: ColorPopoverButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={isActive ? "secondary" : "ghost"}
          size="icon"
          aria-label={ariaLabel}
          className="relative"
        >
          <Icon className="size-4" />
          {activeColor && (
            <span
              className="absolute inset-x-2 bottom-1.5 h-0.5 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-1">
          {DEVOTION_CONTENT_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              onClick={() => {
                onPick(swatch.value);
                setOpen(false);
              }}
              className={cn(
                "size-7 rounded-full border transition-transform hover:scale-110",
                activeColor === swatch.value &&
                  "ring-2 ring-ring ring-offset-2 ring-offset-popover",
              )}
              style={{ backgroundColor: swatch.value }}
            />
          ))}
        </div>
        <Separator className="my-2" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            onClear();
            setOpen(false);
          }}
        >
          เอาสีออก
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// Medium-style rich text editor — bold/italic/strike/inline code/headings/
// quote/lists/code block/สี/เน้นข้อความ plus inline image insertion at the
// cursor. Images are resized client-side (see image-resize.ts) and
// uploaded to Supabase Storage immediately on selection (see
// devotion-image.ts) — the URL inserted into the editor is the real,
// persisted public URL, not a local object URL.
//
// Color/Highlight ต้องเพิ่ม TextStyle + Color + Highlight extension เข้ามา
// (StarterKit เดิมไม่มี mark สี) — จานสีพรีเซ็ตอยู่ที่
// lib/devotion-content-colors.ts เลือกมาให้อ่านได้ทั้ง light/dark theme
// เพราะสีถูกฝัง inline style ตรงๆ ไม่ปรับตาม theme (ดู grill-me
// 2026-08-25) ส่วน heading คงไว้แค่ level 2-3 เหมือนเดิม (เนื้อหาอยู่ใต้
// หัวข้อบทความ h2 ของหน้าอยู่แล้ว) Strike/Code/CodeBlock มากับ StarterKit
// อยู่แล้ว แค่เพิ่มปุ่มเรียกใช้เท่านั้น
export const ArticleEditor = forwardRef<
  ArticleEditorHandle,
  ArticleEditorProps
>(function ArticleEditor(
  {
    placeholder,
    initialContent,
    onChangeHtml,
    onUploadingChange,
    isPublic,
    className,
  },
  ref,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  // บังคับ re-render toolbar ตอน selection/mark เปลี่ยน — editor.isActive()
  // กับ editor.getAttributes() อ่านจาก state ปัจจุบันของ editor โดยตรง
  // (ไม่ใช่ React state) จึงต้อง subscribe เองผ่าน onSelectionUpdate/
  // onTransaction ไม่งั้นปุ่ม (โดยเฉพาะ underline สีใต้ปุ่ม Color/
  // Highlight) จะไม่ sync กับตำแหน่ง cursor ที่ขยับ
  const [, forceUpdate] = useState(0);

  const editor = useEditor({
    content: initialContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image,
      Placeholder.configure({
        placeholder: placeholder ?? "เขียนเนื้อหาบทความของคุณที่นี่...",
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[320px] text-sm leading-relaxed focus:outline-none sm:text-base",
          "[&_p.is-editor-empty:first-child::before]:text-muted-foreground [&_p.is-editor-empty:first-child::before]:float-start [&_p.is-editor-empty:first-child::before]:h-0 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          DEVOTION_CONTENT_CLASS,
        ),
      },
    },
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
    onSelectionUpdate: () => forceUpdate((n) => n + 1),
    onTransaction: () => forceUpdate((n) => n + 1),
  });

  // แทรก HTML ที่ท้ายเอกสารเสมอ (ไม่ใช่ตำแหน่ง cursor เดิม) เพราะผู้ใช้เพิ่ง
  // สลับโฟกัสไปที่ bottom sheet คัมภีร์มา cursor เดิมใน editor จึงไม่มี
  // ความหมายแล้ว — เขียนต่อจากข้อที่แทรกได้เลย (ดู grill-me 2026-08-13)
  useImperativeHandle(
    ref,
    () => ({
      insertHtml: (html: string) => {
        editor?.chain().focus("end").insertContent(html).run();
      },
    }),
    [editor],
  );

  const handleImageButtonClick = () => fileInputRef.current?.click();

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น");
      return;
    }

    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadDevotionImage(file, isPublic);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (error) {
      toast.error("อัปโหลดรูปไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  };

  if (!editor) return null;

  const textColor = editor.getAttributes("textStyle").color as
    | string
    | undefined;
  const highlightColor = editor.getAttributes("highlight").color as
    | string
    | undefined;

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="ตัวหนา"
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="ตัวเอียง"
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria-label="ขีดฆ่า"
        >
          <Strikethrough />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleCode().run()}
          aria-label="โค้ดในบรรทัด"
        >
          <Code />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ColorPopoverButton
          icon={Baseline}
          ariaLabel="สีตัวอักษร"
          activeColor={textColor}
          isActive={!!textColor}
          onPick={(color) => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />
        <ColorPopoverButton
          icon={Highlighter}
          ariaLabel="เน้นข้อความ"
          activeColor={highlightColor}
          isActive={editor.isActive("highlight")}
          onPick={(color) =>
            editor.chain().focus().toggleHighlight({ color }).run()
          }
          onClear={() => editor.chain().focus().unsetHighlight().run()}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
          }
          size="icon"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label="หัวข้อย่อย"
        >
          <Heading2 />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="คำคม"
        >
          <Quote />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="รายการหัวข้อ"
        >
          <List />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="รายการลำดับเลข"
        >
          <ListOrdered />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
          size="icon"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="บล็อกโค้ด"
        >
          <SquareCode />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleImageButtonClick}
          disabled={isUploading}
          aria-label="แทรกรูปภาพ"
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});
