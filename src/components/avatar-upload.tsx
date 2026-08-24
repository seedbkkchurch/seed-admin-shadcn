import { useRef, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { cropAndResizeImage } from "@/lib/image-resize";
import { uploadAvatar } from "@/lib/supabase/avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — matches bucket-seed Storage limit (grill-me 2026-08-24)
const AVATAR_SIZE = 256;

type AvatarUploadCommonProps = {
  imageUrl?: string | null;
  initials: string;
  className?: string;
  disabled?: boolean;
};

type ImmediateProps = AvatarUploadCommonProps & {
  mode: "immediate";
  nickname: string;
  lambId: string;
  onUploaded: (url: string) => void;
};

type DeferredProps = AvatarUploadCommonProps & {
  mode: "deferred";
  onFileReady: (blob: Blob | null, previewUrl: string | null) => void;
};

type AvatarUploadProps = ImmediateProps | DeferredProps;

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "ขนาดไฟล์ต้องไม่เกิน 10MB";
  }
  return null;
}

export function AvatarUpload(props: AvatarUploadProps) {
  const { imageUrl, initials, className, disabled } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? imageUrl ?? undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsBusy(true);
    try {
      const resized = await cropAndResizeImage(file, AVATAR_SIZE);
      const localPreview = URL.createObjectURL(resized);
      setPreviewUrl(localPreview);

      if (props.mode === "deferred") {
        props.onFileReady(resized, localPreview);
        return;
      }

      const url = await uploadAvatar({
        blob: resized,
        nickname: props.nickname,
        lambId: props.lambId,
        previousUrl: imageUrl,
      });
      props.onUploaded(url);
      toast.success("อัปเดตรูปโปรไฟล์แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={cn("group relative inline-flex", className)}>
      <Avatar className="size-full rounded-2xl">
        {displayUrl && <AvatarImage src={displayUrl} alt="" />}
        <AvatarFallback className="rounded-2xl text-4xl">
          {initials}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        disabled={disabled || isBusy}
        onClick={() => inputRef.current?.click()}
        aria-label="Upload avatar"
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 text-transparent transition-colors",
          "group-hover:bg-black/40 group-hover:text-white",
          "focus-visible:bg-black/40 focus-visible:text-white focus-visible:outline-none",
          "disabled:cursor-not-allowed",
        )}
      >
        {isBusy ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Pencil className="size-6" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        disabled={disabled || isBusy}
        onChange={handleFileChange}
      />
    </div>
  );
}
