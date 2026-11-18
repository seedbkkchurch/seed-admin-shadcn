import { Link } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyBackground } from "../data/daily-background";
import { useVerseOfTheDay } from "../data/verse-of-the-day";
import { BackgroundPhoto } from "./background-photo";
import { VerseShareButton } from "./verse-share-button";

// การ์ดข้อพระคัมภีร์ประจำวัน — พื้นเข้มตายตัวทั้ง light/dark ให้เป็นจุดเด่น
// บนสุดของหน้า (ดู data/verse-of-the-day.ts ว่าข้อมาจากไหน) พื้นหลังเป็นรูป
// ธรรมชาติสุ่มวันละรูปจาก Pexels (data/daily-background.ts) ทับด้วยชั้นมืดให้
// ตัวอักษรขาวอ่านออกทุกรูป โหลดรูปไม่ได้ก็เหลือพื้นไล่เฉดเข้มเดิม
export function VerseOfTheDayCard({ today }: { today: Date }) {
  const verse = useVerseOfTheDay(today);
  const { ref, reference, text, isPending, isError } = verse;
  const { data: background } = useDailyBackground(today);

  return (
    <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl bg-linear-to-br from-slate-800 to-slate-950 p-5 text-white ring-1 ring-white/10 ring-inset">
      {background && <BackgroundPhoto photo={background} />}

      <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
        <BookOpenText className="size-4" />
        ข้อพระคัมภีร์ประจำวัน
      </div>

      {isPending ? (
        <div className="relative space-y-3">
          <Skeleton className="h-6 w-full bg-white/15" />
          <Skeleton className="h-6 w-4/5 bg-white/15" />
          <Skeleton className="h-4 w-32 bg-white/15" />
        </div>
      ) : isError || !ref ? (
        <p className="relative text-white/70">
          โหลดข้อพระคัมภีร์ประจำวันไม่สำเร็จ
        </p>
      ) : (
        <blockquote className="relative space-y-3">
          <p className="text-lg leading-relaxed font-medium text-balance sm:text-xl sm:leading-relaxed">
            {text}
          </p>
          <footer className="text-sm text-white/80">
            {reference} · ฉบับ Thai KJV
          </footer>
        </blockquote>
      )}

      {ref && (
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25"
            >
              <Link
                to="/bible/$book/$chapter"
                params={{
                  book: String(ref.bookNumber),
                  chapter: String(ref.chapter),
                }}
              >
                อ่านทั้งบท
              </Link>
            </Button>
            <VerseShareButton verse={verse} />
          </div>
          {background && (
            <a
              href={background.pexelsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-white/60 hover:text-white"
            >
              ภาพ: {background.photographer} / Pexels
            </a>
          )}
        </div>
      )}
    </section>
  );
}
