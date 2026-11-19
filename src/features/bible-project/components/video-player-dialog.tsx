import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type BibleProjectVideo,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from "../data/videos";

// Dialog เล่นวิดีโอ BibleProject ในแอป (ฝัง youtube-nocookie) แทนการเด้งออก
// ไป YouTube — ไม่หลุดจาก PWA standalone (grill-me 2026-11-19) ใช้ทั้งในหน้า
// /bible-project (ส่งวิดีโอเดียว) และปุ่ม 🎬 ในหน้าอ่านพระคัมภีร์ (ส่งหลายตอน
// ของเล่มเดียวกัน เช่น ปฐมกาล 1-11 / 12-50 → แสดงปุ่มเลือกตอน)
export function VideoPlayerDialog({
  videos,
  open,
  onOpenChange,
}: {
  videos: BibleProjectVideo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [index, setIndex] = useState(0);

  // ปิดแล้วรีเซ็ตกลับตอนแรก — เปิดใหม่ทุกครั้งเริ่มที่ตอนแรก
  const handleOpenChange = (next: boolean) => {
    if (!next) setIndex(0);
    onOpenChange(next);
  };

  const video = videos[index] ?? videos[0];
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-3 p-4 sm:max-w-3xl">
        <DialogHeader className="pe-6 text-start">
          <DialogTitle className="leading-snug">{video.title}</DialogTitle>
          <DialogDescription>{video.titleEn}</DialogDescription>
        </DialogHeader>

        {videos.length > 1 && (
          <div className="flex flex-wrap gap-2" role="tablist">
            {videos.map((item, i) => (
              <button
                key={item.youtubeId}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  i === index
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {item.titleEn}
              </button>
            ))}
          </div>
        )}

        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {open && (
            <iframe
              key={video.youtubeId}
              src={youtubeEmbedUrl(video.youtubeId)}
              title={video.title}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          )}
        </div>

        <a
          href={youtubeWatchUrl(video.youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 self-end text-xs"
        >
          เปิดใน YouTube
          <ExternalLink className="size-3" />
        </a>
      </DialogContent>
    </Dialog>
  );
}
