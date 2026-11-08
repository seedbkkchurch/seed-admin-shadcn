import { useEffect, useMemo, useRef, useState } from "react";
import { toBlob, toCanvas } from "html-to-image";
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
import { useGiphySearch } from "@/features/lamb-info/data/giphy";
import { usePexelsSearch } from "@/features/lamb-info/data/pexels";
import { safeFileNamePart, shareOrDownloadImage } from "@/lib/share-image";
import { cn } from "@/lib/utils";
import { type BibleLanguageMode, type BibleVerse } from "../data/types";
import {
  ANIMATED_HEIGHT,
  ANIMATED_WIDTH,
  buildAnimatedVerseGif,
} from "../lib/animated-gif";
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
const DEFAULT_PHOTO_QUERY = "sunrise nature light";
// GIF เริ่มต้น: ธรรมชาติเคลื่อนไหวเบาๆ (ไม่ใช่ GIF ตลก) เหมาะเป็นพื้นหลังข้อความ
const DEFAULT_GIF_QUERY = "nature sky clouds";
const PREVIEW_SCALE = 0.26;

type BackgroundSource = "photo" | "gif";
type OutputMode = "still" | "animated";

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

type Thumb = { id: string; thumbUrl: string; fullUrl: string; label: string };

// หน้าต่าง "แชร์เป็นการ์ด" ของหน้าพระคัมภีร์ (grill-me 2026-11-08):
// - ภาษา (ไทย/อังกฤษ/ทั้งสอง ตามที่ฉบับนี้มี)
// - พื้นหลัง: แท็บ "รูปภาพ" (Pexels) หรือ "GIF" (GIPHY) — แถวแนะนำ + ค้นหา
// - ถ้าเป็น GIF เลือกผลลัพธ์ได้: ภาพนิ่ง (PNG 1080x1350 เฟรมเดียว) หรือ
//   GIF เคลื่อนไหว (540x675 สร้างใน lib/animated-gif.ts)
// รูปผลลัพธ์สร้างล่วงหน้าทุกครั้งที่เปลี่ยนตัวเลือก ปุ่มแชร์เรียกได้ทันที
// (กัน iOS ตัดสิทธิ์ user gesture) เหมือนการ์ดสถิติเฝ้าเดี่ยว
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

  const [source, setSource] = useState<BackgroundSource>("photo");
  const [outputMode, setOutputMode] = useState<OutputMode>("still");
  const animated = source === "gif" && outputMode === "animated";

  // ค้นหาแยกตามแหล่ง — ช่องค้นหาเดียว ใช้กับแท็บที่เปิดอยู่
  const [queryInput, setQueryInput] = useState("");
  const [photoQuery, setPhotoQuery] = useState(DEFAULT_PHOTO_QUERY);
  const [gifQuery, setGifQuery] = useState(DEFAULT_GIF_QUERY);
  const pexels = usePexelsSearch(open && source === "photo" ? photoQuery : "");
  const giphy = useGiphySearch(gifQuery, open && source === "gif");
  const activeSearch = source === "photo" ? pexels : giphy;

  const thumbs: Thumb[] = useMemo(() => {
    if (source === "photo") {
      return (pexels.data?.pages.flatMap((p) => p.photos) ?? []).map((p) => ({
        id: `p${p.id}`,
        thumbUrl: p.thumbUrl,
        fullUrl: p.imageUrl,
        label: p.alt || "รูปพื้นหลัง",
      }));
    }
    return (giphy.data?.pages.flatMap((p) => p.gifs) ?? []).map((g) => ({
      id: `g${g.id}`,
      thumbUrl: g.thumbUrl,
      fullUrl: g.gifUrl,
      label: g.title || "GIF",
    }));
  }, [source, pexels.data, giphy.data]);

  const [selectedId, setSelectedId] = useState<
    Record<BackgroundSource, string | null>
  >({
    photo: null,
    gif: null,
  });
  const selected =
    thumbs.find((t) => t.id === selectedId[source]) ?? thumbs[0] ?? null;
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

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

  const rawUrl = selected?.fullUrl ?? null;
  const imageUrl = rawUrl && rawUrl !== failedUrl ? rawUrl : null;

  const cardRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const renderKey = `${sorted.join(",")}|${lang}|${imageUrl ?? "none"}|${animated ? "anim" : "still"}`;
  const [rendered, setRendered] = useState<{ key: string; blob: Blob } | null>(
    null,
  );
  const [progress, setProgress] = useState<{
    key: string;
    ratio: number;
  } | null>(null);
  const blob = rendered?.key === renderKey ? rendered.blob : null;
  const progressRatio = progress?.key === renderKey ? progress.ratio : 0;
  // รอผลค้นหาชุดแรกก่อนค่อยสร้าง (ไม่งั้นได้การ์ดพื้นเรียบแวบนึง)
  const waitingThumbs = activeSearch.isPending && !activeSearch.isError;

  useEffect(() => {
    if (!open || tooLong || waitingThumbs) return;
    const signal = { cancelled: false };
    const run = async () => {
      await new Promise((r) => setTimeout(r, 60));
      if (signal.cancelled) return;

      if (animated && imageUrl) {
        const node = overlayRef.current;
        if (!node) return;
        await Promise.all(
          [...node.querySelectorAll("img")].map((img) =>
            img.decode().catch(() => undefined),
          ),
        );
        const overlay = await toCanvas(node, {
          width: 1080,
          height: 1350,
          canvasWidth: ANIMATED_WIDTH,
          canvasHeight: ANIMATED_HEIGHT,
          pixelRatio: 1,
        });
        let result: Blob | null;
        try {
          result = await buildAnimatedVerseGif({
            gifUrl: imageUrl,
            overlay,
            signal,
            onProgress: (ratio) => {
              if (!signal.cancelled) setProgress({ key: renderKey, ratio });
            },
          });
        } catch {
          if (!signal.cancelled) {
            toast.error("สร้าง GIF เคลื่อนไหวไม่สำเร็จ ลองเลือก GIF อื่น");
          }
          return;
        }
        if (!signal.cancelled && result) {
          setRendered({ key: renderKey, blob: result });
        }
        return;
      }

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
        if (!signal.cancelled && imageUrl) {
          toast.info("โหลดพื้นหลังไม่สำเร็จ ใช้พื้นเรียบแทน");
          setFailedUrl(imageUrl);
        }
        return;
      }
      if (!signal.cancelled && result) {
        setRendered({ key: renderKey, blob: result });
      }
    };
    run().catch(() => {
      if (!signal.cancelled) toast.error("สร้างการ์ดไม่สำเร็จ");
    });
    return () => {
      signal.cancelled = true;
    };
  }, [open, renderKey, tooLong, waitingThumbs, animated, imageUrl]);

  const fileName = `${safeFileNamePart(`${bookNameTh}-${chapter}-${range}`)}.${animated ? "gif" : "png"}`;

  const cardProps = {
    thLines,
    enLines,
    reference,
    subReference,
    showVerseNumbers: sorted.length > 1,
  };

  const langLabel: Record<BibleLanguageMode, string> = {
    th: "ไทย",
    en: "อังกฤษ",
    both: "ทั้งสองภาษา",
  };

  const busyLabel = animated
    ? `กำลังสร้าง GIF… ${Math.round(progressRatio * 100)}%`
    : "กำลังสร้างการ์ด…";

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
            <Tabs
              value={source}
              onValueChange={(v) => {
                setSource(v as BackgroundSource);
                setQueryInput("");
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="photo" className="flex-1">
                  รูปภาพ
                </TabsTrigger>
                <TabsTrigger value="gif" className="flex-1">
                  GIF
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const q = queryInput.trim();
                if (!q) return;
                if (source === "photo") setPhotoQuery(q);
                else setGifQuery(q);
                setSelectedId((prev) => ({ ...prev, [source]: null }));
              }}
            >
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={
                  source === "photo"
                    ? "ค้นหารูปพื้นหลัง เช่น ภูเขา, ทะเล, sky"
                    : "ค้นหา GIF เช่น rain, ocean, light"
                }
                className="h-10 text-base"
              />
              <Button type="submit" variant="outline" className="h-10">
                <Search /> ค้นหา
              </Button>
            </form>

            <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1">
              {waitingThumbs
                ? Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-muted size-16 shrink-0 animate-pulse rounded-md"
                    />
                  ))
                : thumbs.map((t) => {
                    const active = t.id === selected?.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setSelectedId((prev) => ({ ...prev, [source]: t.id }))
                        }
                        className={cn(
                          "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                          active ? "border-[#05C64F]" : "border-transparent",
                        )}
                        aria-label={t.label}
                      >
                        <img
                          src={t.thumbUrl}
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
            {activeSearch.isError && (
              <p className="text-destructive text-sm">
                {activeSearch.error instanceof Error
                  ? activeSearch.error.message
                  : "ค้นหาไม่สำเร็จ"}{" "}
                — ใช้พื้นเรียบแทนได้
              </p>
            )}
            {!waitingThumbs && !activeSearch.isError && thumbs.length === 0 && (
              <p className="text-muted-foreground text-sm">
                ไม่พบผลลัพธ์ ลองคำอื่นดู
              </p>
            )}
            {source === "gif" && (
              <div className="flex items-center justify-between gap-3">
                <Tabs
                  value={outputMode}
                  onValueChange={(v) => setOutputMode(v as OutputMode)}
                >
                  <TabsList>
                    <TabsTrigger value="still">ภาพนิ่ง</TabsTrigger>
                    <TabsTrigger value="animated">GIF เคลื่อนไหว</TabsTrigger>
                  </TabsList>
                </Tabs>
                <span className="text-muted-foreground text-xs font-semibold">
                  Powered by GIPHY
                </span>
              </div>
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
                  {/* พรีวิวใช้ <img> ปกติ — ถ้าเป็น GIF จะขยับให้เห็นเลย */}
                  <BibleVerseShareCard imageUrl={imageUrl} {...cardProps} />
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
            {!blob && !tooLong ? busyLabel : animated ? "แชร์ GIF" : "แชร์"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* ตัว capture ขนาดจริง วางนอกจอ (ไม่ใช้ display:none) — การ์ดเต็ม
      สำหรับภาพนิ่ง และชั้นบนโปร่งใส (bare) สำหรับทับเฟรม GIF เคลื่อนไหว */}
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
          {animated ? (
            <BibleVerseShareCard
              ref={overlayRef}
              imageUrl={null}
              bare
              {...cardProps}
            />
          ) : (
            <BibleVerseShareCard
              ref={cardRef}
              imageUrl={imageUrl}
              {...cardProps}
            />
          )}
        </div>
      )}
    </>
  );
}
