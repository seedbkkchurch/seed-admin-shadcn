import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { BibleMusicAdder } from "../data/queries";

function adderName(adder: BibleMusicAdder) {
  return adder.nick_name || adder.first_name || adder.last_name || "";
}

// "เพิ่มโดย …" — รูปโปรไฟล์ + ชื่อเล่นจาก lamb_info ของคนที่เพิ่มเพลง ใช้ทั้ง
// ในหน้า /bible-music และรายการเพลง ☰ ของตัวเล่น (grill-me 2026-11-20)
// เพลงที่ไม่มี added_by (เพิ่มก่อนมีคอลัมน์นี้ หรือบัญชีไม่ผูก lamb) ไม่แสดง
export function TrackAdder({
  adder,
  className,
}: {
  adder: BibleMusicAdder | null;
  className?: string;
}) {
  if (!adder) return null;
  const name = adderName(adder);
  return (
    <span
      className={cn(
        "text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs",
        className,
      )}
    >
      <Avatar className="size-4 shrink-0">
        {adder.profile_picture && (
          <AvatarImage src={adder.profile_picture} alt="" />
        )}
        <AvatarFallback className="text-[8px]">
          {name.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">เพิ่มโดย {name}</span>
    </span>
  );
}
