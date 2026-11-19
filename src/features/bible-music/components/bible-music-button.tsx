import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBibleMusic } from "../lib/bible-music-context";

type BibleMusicButtonVariant = "header" | "mobile-header" | "inline";

// แท่งเสียง 3 แท่งขยับตอนเพลงกำลังเล่น (keyframes music-eq ใน
// styles/index.css) — เครื่องที่ตั้ง "ลดการเคลื่อนไหว" จะเห็นแท่งนิ่ง
const EQ_BARS = [
  { height: "h-[55%]", delay: "-0.2s", duration: "0.9s" },
  { height: "h-full", delay: "-0.5s", duration: "0.75s" },
  { height: "h-[75%]", delay: "0s", duration: "1.05s" },
];

function EqualizerBars({ large }: { large: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex items-end gap-[2px]", large ? "h-5" : "h-4")}
    >
      {EQ_BARS.map((bar, index) => (
        <span
          key={index}
          className={cn(
            "origin-bottom animate-[music-eq_0.9s_ease-in-out_infinite] rounded-full bg-current motion-reduce:animate-none",
            large ? "w-1" : "w-[3px]",
            bar.height,
          )}
          style={{
            animationDelay: bar.delay,
            animationDuration: bar.duration,
          }}
        />
      ))}
    </span>
  );
}

// ปุ่ม 🎵 เปิด/ปิดเพลงพื้นหลัง (grill-me 2026-11-20 รอบ header มือถือ)
// variant:
//   - "header" (ค่าเริ่มต้น) ปุ่มเล็กใน header ของทุกหน้า — ซ่อนบนมือถือ
//     (< md) เพราะ Header วางปุ่มใหญ่แทนช่อง Search ไว้แล้ว
//   - "mobile-header" ปุ่มกลมใหญ่ที่ Header วางแทน Search บนมือถือ
//   - "inline" ปุ่มเล็กที่แสดงทุกขนาดจอ เช่นในโหมดอ่านเต็มจอ (ซ่อน header)
// สถานะ (เหมือนกันทุก variant): ปิดตัวเล่น = ม่วงอ่อน, กำลังเล่น = ม่วงเข้ม +
// แท่งเสียงขยับ, หยุดชั่วคราว = ม่วงเข้มโน้ตนิ่ง, ไม่มีเพลงที่เปิดใช้ = กดแล้ว
// ไปหน้า /bible-music ให้เพิ่มเพลง — ซ่อนเมื่ออยู่นอก BibleMusicProvider
export function BibleMusicButton({
  variant = "header",
  className,
}: {
  variant?: BibleMusicButtonVariant;
  className?: string;
}) {
  const music = useBibleMusic();
  if (!music) return null;

  const large = variant === "mobile-header";
  const noTracks = !music.isLoading && music.tracks.length === 0;
  const active = music.open && !noTracks;
  const buttonClass = cn(
    "rounded-full",
    large && "size-10",
    variant === "header" && "max-md:hidden",
    active
      ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white dark:bg-violet-500 dark:hover:bg-violet-600 dark:hover:text-white"
      : "bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 hover:text-violet-800 dark:text-violet-300 dark:hover:bg-violet-500/25 dark:hover:text-violet-200",
    className,
  );
  const iconClass = large ? "size-5" : "size-4";

  if (noTracks) {
    const label = "ยังไม่มีเพลง — ไปเพิ่มเพลง";
    return (
      <Button asChild variant="ghost" size="icon" className={buttonClass}>
        <Link to="/bible-music" aria-label={label} title={label}>
          <Music className={iconClass} />
        </Link>
      </Button>
    );
  }

  const label = music.open ? "ปิดเพลงพื้นหลัง" : "เปิดเพลงพื้นหลัง";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={buttonClass}
      aria-label={label}
      aria-pressed={music.open}
      title={label}
      onClick={music.toggle}
    >
      {music.playing ? (
        <EqualizerBars large={large} />
      ) : (
        <Music className={iconClass} />
      )}
    </Button>
  );
}
