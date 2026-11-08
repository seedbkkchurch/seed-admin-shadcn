import { useEffect, useMemo, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { Check, Loader2, Search, Share2 } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePexelsSearch } from "@/features/lamb-info/data/pexels";
import { safeFileNamePart, shareOrDownloadImage } from "@/lib/share-image";
import { cn } from "@/lib/utils";
import { type BibleLanguageMode, type BibleVerse } from "../data/types";
import {
  cleanEnglishVerseText,
  cleanQuoteText,
  formatVerseRange,
} from "../lib/build-verse-quote-html";
import {
  BibleVerseShareCard,
  VERSE_CARD_MAX_CHARS,
  type VerseShareLine,
} from "./bible-verse-share-card";

// คำค้นรูปเริ่มต้น — โทนแสงธรรมชาติสงบๆ เข้ากับข้อพระคัมภีร์ (grill-me 2026-11-08)
const DEFAULT_QUERY = "sunrise nature light";
const PREVIEW_SCALE = 0.26;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookNameTh: string;
  bookNameEn: string;
  chapter: number;
  verseNumbers: number[];
  enVerses: Map<number, BibleVerse>;
  thVerses: Map<number, BibleVerse>;
  // โหมดภาษาที่กำลังอ่าน — ใช้เป็นค่าเริ่มต้นของตัวเลือกภาษาบนการ์ด
  mode: BibleLanguageMode;
  // ชื่อย่อฉบับ เช่น "KJV", "TNCV"
  versionCode: string;
};

// หน้าต่าง "แชร์เป็นการ์ด" ของหน้าพระคัมภีร์ (grill-me 2026-11-08):
// เลือกภาษา (ไทย/อังกฤษ/ทั้งสอง ตามที่ฉบับนี้มี) + รูปพื้นหลังจาก Pexels
// (แถวรูปแนะนำ + ช่องค้นหา) + พรีวิว + ปุ่มแชร์ใหญ่ รูปสร้างล่วงหน้าทุกครั้ง
// ที่เปลี่ยนตัวเลือก เหมือนการ์ดสถิติเฝ้าเดี่ยว
export function BibleVerseShareDialog({
  open,
  onOpenChange,
  bookNameTh,
  bookNameEn,
  chapter,
  verseNumbers,
  enVerses,
  thVerses,
  mode,
  versionCode,
}: Props) {
  const sorted = useMemo(
    () => [...verseNumbers].sort((a, b) => a - b),
    [verseNumbers],
  );
  const hasTh = sorted.some((v) => thVerses.get(v)?.text);
  const hasEn = sorted.some((v) => enVerses.get(v)?.text);
  const langOptions: BibleLanguageMode[] = [
    ...(hasTh ? (["th"] as const) : []),
    ...(hasEn ? (["en"] as const) : []),
    ...(hasTh && hasEn ? (["both"] as const) : []),
  ];
  const [langChoice, setLangChoice] = useState<BibleLanguageMode>(mode);
  const lang = langOptions.includes(langChoice)
    ? langChoice
    : (langOptions[0] ?? "th");

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const pexels = usePexelsSearch(open ? query : "");
  const photos = useMemo(
    () => pexels.data?.pages.flatMap((p) => p.photos) ?? [],
    [pexels.data],
  );
  const [photoId, setPhotoId] = useState<number | null>(null);
  const photo = photos.find((p) => p.id === photoId) ?? photos[0] ?? null;
  const [imageFailed, setImageFailed] = useState(false);

  const buildLines = (which: "th" | "en"): VerseShareLine[] =>
    sorted.flatMap((v) => {
      const raw =
        which === "th" ? thVerses.get(v)?.text : enVerses.get(v)?.text;
      if (!raw) return [];
      const text =
        which === "th"
          ? cleanQuoteText(raw)
          : cleanEnglishVerseText(cleanQuoteText(raw));
      return [{ verse: v, text: text.trim() }];
    });
  const thLines = lang === "en" ? [] : buildLines("th");
  const enLines = lang === "th" ? [] : buildLines("en");
  const range = formatVerseRange(sorted);
  const reference =
    lang === "en"
      ? `${bookNameEn} ${chapter}:${range}`
      : `${bookNameTh} ${chapter}:${range}`;
  const subReference =
    lang === "both"
      ? `${bookNameEn} ${chapter}:${range} · ${versionCode}`
      : versionCode;
  const totalChars =
    thLines.reduce((n, l) => n + l.text.length, 0) +
    enLines.reduce((n, l) => n + l.text.length, 0) *
      (lang === "both" ? 0.5 : 1);
  const tooLong = totalChars > VERSE_CARD_MAX_CHARS;

  const imageUrl = imageFailed ? null : (photo?.imageUrl ?? null);
  const cardRef = useRef<HTMLDivElement>(null);
  const renderKey = `${sorted.join(",")}|${lang}|${imageUrl ?? "none"}`;
  const [rendered, setRendered] = useState<{ key: string; blob: Blob } | null>(
    null,
  );
  const blob = rendered?.key === renderKey ? rendered.blob : null;
  // รอผลค้นหารูปชุดแรกก่อนค่อยสร้าง (ไม่งั้นได้การ์ดพื้นเรียบแวบนึง)
  const waitingPhotos = pexels.isPending && !pexels.isError;

  useEffect(() => {
    if (!open || tooLong || waitingPhotos) return;
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => setTimeout(r, 60));
      const node = cardRef.current;
      if (!node) return;
      let result: Blob | null;
      try {
        await Promise.all(
          [...node.querySelectorAll("img")].map((img) =>
            img.decode().catch(() => undefined),
          ),
        );
        result = await toBlob(node, { pixelRatio: 1, cacheBust: true });
      } catch {
        // รูปพื้นหลังโหลดข้ามโดเมนไม่ได้ — ใช้พื้นเรียบแทน (effect จะรันใหม่)
        if (!cancelled && imageUrl) {
          toast.info("โหลดรูปพื้นหลังไม่สำเร็จ ใช้พื้นเรียบแทน");
          setImageFailed(true);
        }
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
  }, [open, renderKey, tooLong, waitingPhotos, imageUrl]);

  const fileName = `${safeFileNamePart(`${bookNameTh}-${chapter}-${range}`)}.png`;

  const card = (ref?: React.Ref<HTMLDivElement>) => (
    <BibleVerseShareCard
      ref={ref}
      imageUrl={imageUrl}
      thLines={thLines}
      enLines={enLines}
      reference={reference}
      subReference={subReference}
      showVerseNumbers={sorted.length > 1}
    />
  );

  const langLabel: Record<BibleLanguageMode, string> = {
    th: "ไทย",
    en: "อังกฤษ",
    both: "ทั้งสองภาษา",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle>แชร์ข้อพระคัมภีร์</DialogTitle>
            <DialogDescription>
              {bookNameTh} {chapter}:{range}
            </DialogDescription>
          </DialogHeader>

          {langOptions.length > 1 && (
            <Tabs
              value={lang}
              onValueChange={(v) => setLangChoice(v as BibleLanguageMode)}
            >
              <TabsList className="w-full">
                {langOptions.map((l) => (
                  <TabsTrigger key={l} value={l} className="flex-1">
                    {langLabel[l]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const q = queryInput.trim();
                if (!q) return;
                setQuery(q);
                setPhotoId(null);
                setImageFailed(false);
              }}
            >
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="ค้นหารูปพื้นหลัง เช่น ภูเขา, ทะเล, sky"
                className="h-10 text-base"
              />
              <Button type="submit" variant="outline" className="h-10">
                <Search /> ค้นหา
              </Button>
            </form>
            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
              {pexels.isPending && !pexels.isError
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-muted size-16 shrink-0 animate-pulse rounded-md"
                    />
                  ))
                : photos.map((p) => {
                    const active = p.id === photo?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPhotoId(p.id);
                          setImageFailed(false);
                        }}
                        className={cn(
                          "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                          active ? "border-[#05C64F]" : "border-transparent",
                        )}
                        aria-label={p.alt || "รูปพื้นหลัง"}
                      >
                        <img
                          src={p.thumbUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                        {active && (
                          <Check className="absolute right-1 top-1 size-4 rounded-full bg-[#05C64F] p-0.5 text-white" />
                        )}
                      </button>
                    );
                  })}
            </div>
            {pexels.isError && (
              <p className="text-destructive text-sm">
                ค้นหารูปไม่สำเร็จ — ใช้พื้นเรียบแทนได้
              </p>
            )}
            {!pexels.isPending && !pexels.isError && photos.length === 0 && (
              <p className="text-muted-foreground text-sm">
                ไม่พบรูป ลองคำอื่นดู
              </p>
            )}
          </div>

          {tooLong ? (
            <p className="text-destructive rounded-md border border-destructive/40 p-3 text-sm">
              ข้อความยาวเกินกว่าจะใส่ในการ์ดได้ ลองลดจำนวนข้อที่เลือก
              (ประมาณไม่เกิน 5–6 ข้อ)
            </p>
          ) : (
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
          )}

          <Button
            type="button"
            size="lg"
            className="h-12 w-full bg-[#05C64F] text-base font-semibold text-white hover:bg-[#05C64F]/90"
            disabled={!blob || tooLong}
            onClick={() =>
              blob &&
              shareOrDownloadImage(
                blob,
                fileName,
                `${bookNameTh} ${chapter}:${range}`,
              )
            }
          >
            {!blob && !tooLong ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Share2 className="size-5" />
            )}
            {!blob && !tooLong ? "กำลังสร้างการ์ด…" : "แชร์"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ตัว capture ขนาดจริง วางนอกจอ (ไม่ใช้ display:none) */}
      {open && !tooLong && (
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
      )}
    </>
  );
}
