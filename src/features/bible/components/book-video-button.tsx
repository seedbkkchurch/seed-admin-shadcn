import { useState } from "react";
import { Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayerDialog } from "@/features/bible-project/components/video-player-dialog";
import { getOverviewVideosForBook } from "@/features/bible-project/data/videos";

// ปุ่ม 🎬 วิดีโอภาพรวม BibleProject ของเล่มที่กำลังอ่าน — วางข้าง AiHelpButton
// ทั้งใน BiblePanel และ BibleReadingMode (grill-me 2026-11-19) เล่มที่มีหลายตอน
// (เช่น ปฐมกาล 1-11 / 12-50) เลือกตอนได้ใน dialog
export function BookVideoButton({
  bookNumber,
  bookNameTh,
}: {
  bookNumber: number;
  bookNameTh: string;
}) {
  const [open, setOpen] = useState(false);
  const videos = getOverviewVideosForBook(bookNumber);
  if (videos.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
        aria-label={`ดูวิดีโอภาพรวม ${bookNameTh}`}
        title={`ดูวิดีโอภาพรวม ${bookNameTh}`}
        onClick={() => setOpen(true)}
      >
        <Clapperboard className="size-4" />
      </Button>
      <VideoPlayerDialog videos={videos} open={open} onOpenChange={setOpen} />
    </>
  );
}
