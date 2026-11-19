import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight, PartyPopper, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasBack } from "../lib/friend-utils";
import { type FriendCardData, FriendCard } from "./friend-card";

// ระยะลาก (px) ที่นับเป็นการปัด และระยะที่ยังนับเป็น "แตะ"
const SWIPE_THRESHOLD = 90;
const TAP_SLOP = 6;
// จำนวนการ์ดที่ซ้อนอยู่ข้างหลังใบหน้าสุด
const STACK_DEPTH = 3;

type FriendSwipeDeckProps = {
  friends: FriendCardData[];
  onReshuffle: () => void;
};

// กองการ์ดปัดแบบ Tinder (grill-me 2026-11-19):
// - ปัดซ้าย = คนถัดไป, ปัดขวา = ย้อนคนก่อนหน้า — ไม่บันทึกอะไรลง DB
// - แตะการ์ด (ไม่ได้ลาก) = พลิกดูบุคลิกภาพ/อาหารที่ชอบ
// - ใบสุดท้ายเป็นการ์ดสรุป "รู้จักเพื่อนครบ" + ปุ่มสุ่มใหม่
// - desktop มีปุ่ม/ลูกศรคีย์บอร์ด ← → ด้วย
// ทุกใบถูกวาดด้วย key = id ตำแหน่งคำนวณจาก (ลำดับใบ - index ปัจจุบัน) แล้วให้
// CSS transition พาไป: ใบที่ปัดไปแล้ว (rel = -1) ลอยออกซ้ายแต่ยังอยู่ใน DOM
// พอย้อนกลับจึงลอยกลับเข้ามาเองโดยไม่ต้องจับเวลา
export function FriendSwipeDeck({
  friends,
  onReshuffle,
}: FriendSwipeDeckProps) {
  const total = friends.length;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);

  const isSummary = index >= total;

  const goTo = useCallback(
    (next: number) => {
      setFlipped(false);
      setIndex(Math.max(0, Math.min(total, next)));
    },
    [total],
  );
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // ลูกศรคีย์บอร์ด (ไม่ทำงานตอนพิมพ์ในช่องค้นหา)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable=true]")) return;
      if (event.key === "ArrowRight") goNext();
      else if (event.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ dx: 0, dy: 0 });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    let dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    // ไม่มีทางไปต่อ = ยืดได้นิดเดียวแล้วเด้งกลับ
    if ((dx > 0 && index === 0) || (dx < 0 && isSummary)) dx *= 0.25;
    setDrag({ dx, dy });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current || start.current.id !== event.pointerId) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    start.current = null;
    setDrag(null);

    if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) {
      // แตะ = พลิก (เฉพาะคนที่มีด้านหลัง และไม่ใช่การ์ดสรุป)
      if (!isSummary && hasBack(friends[index])) setFlipped((f) => !f);
      return;
    }
    if (dx <= -SWIPE_THRESHOLD && !isSummary) goNext();
    else if (dx >= SWIPE_THRESHOLD && index > 0) goPrev();
  };

  const onPointerCancel = () => {
    start.current = null;
    setDrag(null);
  };

  const cardStyle = (rel: number): CSSProperties => {
    if (rel < 0) {
      // ปัดไปแล้ว — ลอยออกไปทางซ้าย
      return {
        transform: "translateX(-140%) rotate(-16deg)",
        opacity: 0,
        zIndex: 20,
        pointerEvents: "none",
      };
    }
    if (rel === 0) {
      const dx = drag?.dx ?? 0;
      return {
        transform: `translateX(${dx}px) rotate(${dx / 18}deg)`,
        zIndex: 10,
        transition: drag ? "none" : undefined,
      };
    }
    const depth = Math.min(rel, STACK_DEPTH);
    return {
      transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
      opacity: rel > STACK_DEPTH - 1 ? 0 : 1 - depth * 0.15,
      zIndex: 10 - depth,
      pointerEvents: "none",
    };
  };

  // วาดเฉพาะ: ใบที่เพิ่งปัดไป 1 ใบ + ใบปัจจุบัน + ใบข้างหลัง
  const visible: { key: string; rel: number; friend: FriendCardData | null }[] =
    [];
  for (let i = index - 1; i <= index + STACK_DEPTH; i++) {
    if (i < 0 || i > total) continue;
    visible.push({
      key: i === total ? "summary" : friends[i].id,
      rel: i - index,
      friend: i === total ? null : friends[i],
    });
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {/* ขนาดการ์ด: กว้างสุด 480px / 92% ของจอ / และไม่สูงเกินจอ (เผื่อ
          header + ปุ่มด้านล่าง ~260px) — ขยายจาก 340px ตามคำขอ 2026-11-19 */}
      <div
        className="relative w-[min(480px,92vw,calc((100dvh_-_260px)_*_0.8))] touch-pan-y select-none"
        style={{ aspectRatio: "4 / 5", marginBottom: 28 }}
      >
        {visible.map(({ key, rel, friend }) => (
          <div
            key={key}
            className={cn(
              "absolute inset-0 transition-[transform,opacity] duration-300 ease-out will-change-transform",
              rel === 0 && "cursor-grab active:cursor-grabbing",
            )}
            style={cardStyle(rel)}
            {...(rel === 0
              ? {
                  onPointerDown,
                  onPointerMove,
                  onPointerUp,
                  onPointerCancel,
                  role: "group",
                  "aria-roledescription": "การ์ด",
                  "aria-label": friend
                    ? `${friend.nickName} (${index + 1} จาก ${total})`
                    : "สรุป",
                }
              : { "aria-hidden": true })}
          >
            {friend ? (
              <FriendCard friend={friend} flipped={rel === 0 && flipped} />
            ) : (
              <SummaryCard total={total} onReshuffle={onReshuffle} />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="คนก่อนหน้า"
        >
          <ChevronLeft />
        </Button>
        <span className="text-muted-foreground min-w-16 text-center text-sm tabular-nums">
          {Math.min(index + 1, total)} / {total}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={goNext}
          disabled={isSummary}
          aria-label="คนถัดไป"
        >
          <ChevronRight />
        </Button>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        ปัดซ้ายเพื่อดูคนถัดไป · ปัดขวาเพื่อย้อนกลับ · แตะการ์ดเพื่อพลิกดูบุคลิก
      </p>
    </div>
  );
}

function SummaryCard({
  total,
  onReshuffle,
}: {
  total: number;
  onReshuffle: () => void;
}) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 rounded-[28px] bg-gradient-to-br from-amber-400 via-rose-500 to-fuchsia-600 p-8 text-center text-white shadow-xl">
      <PartyPopper className="size-16" strokeWidth={1.5} />
      <p className="text-2xl font-bold">รู้จักเพื่อนครบ {total} คนแล้ว!</p>
      <p className="text-sm text-white/85">
        ทักทายเพื่อนที่โบสถ์ครั้งหน้ากันนะ
      </p>
      <Button
        variant="secondary"
        className="mt-2 rounded-full"
        // หยุดไม่ให้การแตะปุ่มถูกนับเป็นการลากการ์ด
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onReshuffle}
      >
        <Shuffle /> สุ่มใหม่อีกรอบ
      </Button>
    </div>
  );
}
