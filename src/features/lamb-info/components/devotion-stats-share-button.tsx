import { useEffect, useMemo, useRef, useState } from "react";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isAfter,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { th } from "date-fns/locale";
import { toBlob } from "html-to-image";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDevotionPeriodCounts } from "../hooks/use-devotion-period-counts";
import { DevotionStatsShareCard } from "./devotion-stats-share-card";

type Props = {
  lambId: string;
  name: string;
  avatarUrl?: string | null;
};

// เลือกย้อนหลังได้สูงสุด 24 เดือน หรือถึงเดือนแรกที่เคยเฝ้าเดี่ยว (แล้วแต่อัน
// ไหนใกล้กว่า)
const MAX_MONTHS_BACK = 23;
// พรีวิวในหน้าต่าง: การ์ดจริง 1080x1350 ย่อลงมา
const PREVIEW_SCALE = 0.26;

function thaiMonthYear(date: Date) {
  return `${format(date, "MMMM", { locale: th })} ${date.getFullYear() + 543}`;
}

function longestStreak(days: Date[], devotionDays: Set<string>) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (devotionDays.has(format(d, "yyyy-MM-dd"))) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

// ปุ่ม "แชร์การ์ด" บนหน้า "ประวัติเฝ้าเดี่ยวทั้งหมด" (grill-me 2026-11-08):
// กดแล้วเปิดหน้าต่างเลือกเดือน + พรีวิวการ์ด + ปุ่มแชร์ใหญ่
// - รูปถูกสร้างล่วงหน้าทุกครั้งที่เปลี่ยนเดือน (ไม่ใช่ตอนกดแชร์) ให้ตอนกด
//   navigator.share ถูกเรียกทันทีใน user gesture — iOS Safari จะไม่ตัดสิทธิ์
//   แชร์เพราะรอ capture นาน
// - มือถือ (จอสัมผัส + รองรับแชร์ไฟล์) → หน้าต่างแชร์ของเครื่อง,
//   คอมพิวเตอร์/แชร์ไม่ได้ → ดาวน์โหลด PNG
export function DevotionStatsShareButton({ lambId, name, avatarUrl }: Props) {
  const { devotionDays, week, year, today, isPending } =
    useDevotionPeriodCounts(lambId);
  const [open, setOpen] = useState(false);
  const [monthKey, setMonthKey] = useState(() => format(today, "yyyy-MM"));
  // รูปที่สร้างเสร็จล่าสุด ผูกกับ key ของเดือน/สถานะรูปโปรไฟล์ — ถ้า key ไม่ตรง
  // กับปัจจุบัน แปลว่ากำลังสร้างใหม่อยู่ (ไม่ต้อง setState ใน effect ตรงๆ)
  const [rendered, setRendered] = useState<{ key: string; blob: Blob } | null>(
    null,
  );
  const [avatarFailed, setAvatarFailed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // ข้อพระคัมภีร์หนุนใจ (ไม่บังคับ) — ช่องพิมพ์เป็นแค่ร่าง ไม่อัปเดตการ์ด
  // ระหว่างพิมพ์ ต้องกด "ใส่ลงการ์ด" ก่อน การ์ด/พรีวิว/รูปถึงจะสร้างใหม่ครั้ง
  // เดียว (เดิมสร้างรูปใหม่ทุกครั้งที่หยุดพิมพ์ ผู้ใช้บอกว่าหน่วง 2026-11-08)
  const [verseText, setVerseText] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [appliedVerse, setAppliedVerse] = useState({ text: "", reference: "" });
  const verseDirty =
    appliedVerse.text !== verseText.trim() ||
    appliedVerse.reference !== verseRef.trim();

  // ตัวเลือกเดือน: ใหม่สุดก่อน ตั้งแต่เดือนนี้ย้อนไปถึงเดือนแรกที่มีเฝ้าเดี่ยว
  const monthOptions = useMemo(() => {
    const earliest = [...devotionDays].sort()[0];
    const limit = subMonths(startOfMonth(today), MAX_MONTHS_BACK);
    const first =
      earliest && isAfter(parseISO(earliest), limit)
        ? startOfMonth(parseISO(earliest))
        : limit;
    return eachMonthOfInterval({ start: first, end: today }).reverse();
  }, [devotionDays, today]);

  const month = parseISO(`${monthKey}-01`);
  const isCurrentMonth = isSameMonth(month, today);

  const stats = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });
    const monthCount = days.filter((d) =>
      devotionDays.has(format(d, "yyyy-MM-dd")),
    ).length;
    const yearPrefix = `${month.getFullYear()}-`;
    const yearCount = [...devotionDays].filter((d) =>
      d.startsWith(yearPrefix),
    ).length;
    const bottomStats = isCurrentMonth
      ? [
          { label: "อาทิตย์นี้", value: week },
          { label: "ปีนี้", value: year },
        ]
      : [
          {
            label: "ติดกันยาวสุด (วัน)",
            value: longestStreak(days, devotionDays),
          },
          { label: `ทั้งปี ${month.getFullYear() + 543}`, value: yearCount },
        ];
    return { monthCount, bottomStats };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey, devotionDays, week, year, isCurrentMonth]);

  const renderKey = `${monthKey}|${avatarFailed}|${appliedVerse.text}|${appliedVerse.reference}`;
  const blob = rendered?.key === renderKey ? rendered.blob : null;

  const fileName = `สถิติเฝ้าเดี่ยว-${name
    .replace(/[\\/:*?"<>|()]/g, " ")
    .trim()
    .replace(/\s+/g, "-")}-${monthKey}.png`;

  // สร้างรูปล่วงหน้าเมื่อเปิดหน้าต่าง/เปลี่ยนเดือน
  useEffect(() => {
    if (!open || isPending) return;
    let cancelled = false;
    const run = async () => {
      // รอ 1 frame ให้การ์ดนอกจอ re-render เป็นเดือนใหม่ก่อน
      await new Promise((r) => setTimeout(r, 50));
      const node = cardRef.current;
      if (!node) return;
      let result: Blob | null;
      try {
        result = await toBlob(node, { pixelRatio: 2, cacheBust: true });
      } catch {
        // รูปโปรไฟล์ข้ามโดเมนโหลดไม่ได้ — ใช้ตัวย่อชื่อแทน (effect จะรันใหม่)
        if (!cancelled) setAvatarFailed(true);
        return;
      }
      if (!cancelled && result) setRendered({ key: renderKey, blob: result });
    };
    run().catch(() => {
      if (!cancelled) toast.error("สร้างการ์ดไม่สำเร็จ");
    });
    return () => {
      cancelled = true;
    };
  }, [open, renderKey, isPending, avatarFailed]);

  const download = (b: Blob) => {
    const url = URL.createObjectURL(b);
    const link = document.createElement("a");
    link.download = fileName;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "สถิติเฝ้าเดี่ยว" });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    download(blob);
  };

  const card = (ref?: React.Ref<HTMLDivElement>) => (
    <DevotionStatsShareCard
      ref={ref}
      name={name}
      avatarUrl={avatarUrl}
      avatarFailed={avatarFailed}
      today={today}
      month={month}
      devotionDays={devotionDays}
      monthCount={stats.monthCount}
      bottomStats={stats.bottomStats}
      verse={appliedVerse}
    />
  );

  return (
    <>
      {/* ปุ่มใหญ่ขึ้นตามที่ขอ (2026-11-08) */}
      <Button
        type="button"
        size="lg"
        className="h-12 bg-[#05C64F] px-6 text-base font-semibold text-white hover:bg-[#05C64F]/90"
        disabled={isPending}
        onClick={() => {
          setMonthKey(format(today, "yyyy-MM"));
          setAvatarFailed(false);
          setOpen(true);
        }}
      >
        <Share2 className="size-5" />
        แชร์การ์ด
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แชร์การ์ดเฝ้าเดี่ยว</DialogTitle>
            <DialogDescription>เลือกเดือนที่อยากแชร์</DialogDescription>
          </DialogHeader>

          <Select value={monthKey} onValueChange={setMonthKey}>
            <SelectTrigger className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.toISOString()} value={format(m, "yyyy-MM")}>
                  {thaiMonthYear(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <Label htmlFor="share-verse">ข้อพระคัมภีร์หนุนใจ (ไม่บังคับ)</Label>
            <Textarea
              id="share-verse"
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="พระวจนะของพระองค์เป็นโคมสำหรับเท้าของข้าพระองค์"
              className="text-base"
            />
            <Input
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              maxLength={40}
              placeholder="ที่มา เช่น สดุดี 119:105"
              className="text-base"
              aria-label="ที่มาของข้อพระคัมภีร์"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full text-base"
              disabled={!verseDirty}
              onClick={() =>
                setAppliedVerse({
                  text: verseText.trim(),
                  reference: verseRef.trim(),
                })
              }
            >
              {verseDirty
                ? verseText.trim()
                  ? "ใส่ลงการ์ด"
                  : "เอาข้อพระคัมภีร์ออกจากการ์ด"
                : appliedVerse.text
                  ? "ใส่ลงการ์ดแล้ว ✓"
                  : "ใส่ลงการ์ด"}
            </Button>
          </div>

          {/* พรีวิว: การ์ดตัวเดียวกับที่ capture ย่อขนาดด้วย transform */}
          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-xl border"
              style={{
                width: 1080 * PREVIEW_SCALE,
                height: 1350 * PREVIEW_SCALE,
              }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                {card()}
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full bg-[#05C64F] text-base font-semibold text-white hover:bg-[#05C64F]/90"
            disabled={!blob || verseDirty}
            onClick={handleShare}
          >
            {!blob ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Share2 className="size-5" />
            )}
            {!blob
              ? "กำลังสร้างการ์ด…"
              : verseDirty
                ? "กด “ใส่ลงการ์ด” ก่อนแชร์"
                : "แชร์"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ตัว capture ขนาดจริง วางนอกจอถาวร (ไม่ใช้ display:none) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "-9999px",
          pointerEvents: "none",
        }}
        aria-hidden
      >
        {card(cardRef)}
      </div>
    </>
  );
}
