import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBibleMusic } from "../lib/bible-music-context";

// ปุ่ม 🎵 เปิด/ปิดเพลงพื้นหลัง — อยู่บน header ทุกหน้า (ข้างปุ่มธีม) และใน
// โหมดอ่านพระคัมภีร์เต็มจอ (ที่บัง header) ซ่อนเมื่ออยู่นอก BibleMusicProvider
// (หน้า public) หรือยังไม่มีเพลงที่เปิดใช้
export function BibleMusicButton({ className }: { className?: string }) {
  const music = useBibleMusic();
  if (!music || music.tracks.length === 0) return null;

  const label = music.open ? "ปิดเพลงพื้นหลัง" : "เปิดเพลงพื้นหลัง";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "text-violet-600 hover:text-violet-700 dark:text-violet-400",
        music.open && "bg-violet-500/15",
        className,
      )}
      aria-label={label}
      aria-pressed={music.open}
      title={label}
      onClick={music.toggle}
    >
      <Music className="size-4" />
    </Button>
  );
}
