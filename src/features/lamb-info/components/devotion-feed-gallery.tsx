import {
  type PointerEvent,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DEVOTION_CONTENT_TYPE_LABELS,
  type LambDevotionRow,
} from "../data/devotion-schema";
import {
  htmlToPlainTextParagraphs,
  htmlToPlainTextSnippet,
} from "../lib/devotion-share-snippet";

// Layout "รูปเต็มการ์ด" ของหน้าฟีดเฝ้าเดี่ยว (grill-me 2026-11-15) — สลับกับ
// รายการแบบเดิมด้วยปุ่มใน devotion-feed.tsx:
// - masonry ด้วย CSS columns: การ์ดกว้างเท่ากัน สูงตามสัดส่วนรูปจริง ใช้
//   เต็มความกว้างของหน้า 1/2/3 คอลัมน์ตามความกว้างของพื้นที่เนื้อหา (container
//   query ไม่ใช่ viewport เพราะมี sidebar) ลำดับไล่จากบนลงล่างทีละคอลัมน์
// - การ์ดที่มีรูป: รูปเต็มการ์ด ตัวอักษรซ้อนบนรูป (ป้ายประเภทมุมบน, ผู้เขียน +
//   วันที่ + หัวข้อด้านล่าง บนแถบไล่เฉดมืด) ไม่มีเนื้อหาย่อ ให้รูปเด่น
// - การ์ดที่ไม่มีรูป: พื้นเข้ม เอาหัวข้อ + เนื้อหาย่อมาเป็นตัวเด่นแทน
// สีตัวอักษรบนการ์ดเป็นขาวตายตัวทั้ง light/dark เพราะอยู่บนรูป/พื้นเข้มเสมอ
//
// Hover effect 8bit (grill-me 2026-11-15 รอบสอง): เอาเมาส์ชี้การ์ด รูปจะแตก
// เป็นบล็อกพิกเซลหยาบขึ้นทีละขั้นแบบเกมยุคเก่า แล้วเนื้อหาเต็มของรายการโผล่
// ทับ เลื่อนอ่านในการ์ดได้ (ฟอนต์ปกติ อ่านง่าย) กดการ์ดยังเปิดหน้าอ่านเต็ม
// เหมือนเดิม เฉพาะเมาส์ + โฟกัสคีย์บอร์ด — จอสัมผัสไม่มี hover การ์ดคงเดิม

// ขนาดบล็อกพิกเซล (px) ของแต่ละขั้น ไล่จากละเอียด → หยาบ
const PIXEL_STEPS = [6, 12, 20, 32];
const PIXEL_STEP_MS = 70;
// เมาส์ต้องค้างบนการ์ดเท่านี้ก่อน effect จะเริ่ม — กันการ์ดกระพริบตอนลาก
// เมาส์/เลื่อนหน้าผ่าน
const HOVER_INTENT_MS = 180;

// วาดรูปของการ์ดลง canvas ความละเอียดต่ำ แล้วให้ CSS ขยายแบบ pixelated —
// ได้ภาพบล็อกพิกเซลโดยไม่ต้องอ่านพิกเซลของรูป (รูปข้าม origin จาก Storage
// จึงใช้ได้) ไล่ขั้นไป-กลับตาม active
function usePixelate(
  imgRef: RefObject<HTMLImageElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  active: boolean,
) {
  const level = useRef(-1);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const draw = () => {
      if (level.current < 0 || !img.complete || !img.naturalWidth) {
        canvas.style.opacity = "0";
        return;
      }
      const context = canvas.getContext("2d");
      if (!context) return;
      const width = img.clientWidth;
      const height = img.clientHeight;
      const block = PIXEL_STEPS[level.current];
      canvas.width = Math.max(1, Math.ceil(width / block));
      canvas.height = Math.max(1, Math.ceil(height / block));
      // ครอปต้นทางให้ตรงกับ object-cover ของ <img>
      const scale = Math.max(
        width / img.naturalWidth,
        height / img.naturalHeight,
      );
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      context.drawImage(
        img,
        (img.naturalWidth - sourceWidth) / 2,
        (img.naturalHeight - sourceHeight) / 2,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      canvas.style.opacity = "1";
    };

    const target = active ? PIXEL_STEPS.length - 1 : -1;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      level.current = target;
      draw();
      return;
    }

    const timer = window.setInterval(() => {
      if (level.current === target) {
        window.clearInterval(timer);
        return;
      }
      level.current += level.current < target ? 1 : -1;
      draw();
    }, PIXEL_STEP_MS);
    return () => window.clearInterval(timer);
  }, [active, imgRef, canvasRef]);
}

// active = เมาส์ค้างบนการ์ด (หลังหน่วง HOVER_INTENT_MS) หรือโฟกัสด้วยคีย์บอร์ด
function useReveal() {
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => cancel, []);

  return {
    active,
    handlers: {
      onPointerEnter: (event: PointerEvent<HTMLAnchorElement>) => {
        if (event.pointerType !== "mouse") return;
        cancel();
        timer.current = window.setTimeout(
          () => setActive(true),
          HOVER_INTENT_MS,
        );
      },
      onPointerLeave: () => {
        cancel();
        setActive(false);
      },
      onFocus: (event: React.FocusEvent<HTMLAnchorElement>) => {
        if (event.currentTarget.matches(":focus-visible")) setActive(true);
      },
      onBlur: () => setActive(false),
    },
  };
}

function AuthorRow({ entry }: { entry: LambDevotionRow }) {
  const lambName = entry.lamb_info
    ? (entry.lamb_info.nick_name ?? entry.lamb_info.first_name)
    : "ไม่ทราบชื่อ";
  const avatarUrl = entry.lamb_info?.profile_picture ?? null;

  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-white/80">
      <Avatar className="size-7 ring-1 ring-white/40">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="bg-white/20 text-[10px] text-white">
          {lambName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="truncate font-medium text-white">{lambName}</span>
      <span className="shrink-0 text-xs">
        {format(parseISO(entry.devotion_date), "d MMM yyyy")}
      </span>
    </div>
  );
}

function TypeBadge({ entry }: { entry: LambDevotionRow }) {
  return (
    <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
    </span>
  );
}

function OpenArrow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition-colors group-hover:bg-white group-hover:text-black",
        className,
      )}
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

// เนื้อหาเต็มที่โผล่ทับการ์ดตอน hover — เลื่อนอ่านในการ์ดได้ แปลงเนื้อหา
// เฉพาะตอนเปิดครั้งแรก (ไม่ parse HTML ของทุกการ์ดตั้งแต่โหลดหน้า) ความทึบ
// เปลี่ยนเป็นขั้นๆ (steps) ให้เข้ากับจังหวะพิกเซลของรูป
function RevealOverlay({
  entry,
  active,
  className,
}: {
  entry: LambDevotionRow;
  active: boolean;
  className?: string;
}) {
  const [opened, setOpened] = useState(false);
  if (active && !opened) setOpened(true);

  const paragraphs = useMemo(
    () => (opened ? htmlToPlainTextParagraphs(entry.content_html) : []),
    [opened, entry.content_html],
  );

  return (
    <div
      aria-hidden={!active}
      className={cn(
        "absolute inset-0 transition-opacity duration-300 [transition-timing-function:steps(4,end)] motion-reduce:transition-none",
        // หน่วงให้เห็นรูปแตกเป็นพิกเซลก่อน แล้วเนื้อหาค่อยขึ้น
        active ? "opacity-100 delay-300" : "pointer-events-none opacity-0",
        className,
      )}
    >
      <div className="absolute inset-0 space-y-3 overflow-y-auto p-4 pb-16 [scrollbar-color:rgb(255_255_255/0.4)_transparent]">
        <div className="space-y-1.5">
          <AuthorRow entry={entry} />
          <h3 className="text-lg leading-snug font-semibold text-white">
            {entry.title}
          </h3>
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-white/90">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
      <OpenArrow className="absolute right-4 bottom-4 bg-black/60" />
    </div>
  );
}

const cardClass =
  "group relative mb-4 block break-inside-avoid overflow-hidden rounded-2xl focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

function ImageCard({
  entry,
  coverImage,
}: {
  entry: LambDevotionRow;
  coverImage: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { active, handlers } = useReveal();
  usePixelate(imgRef, canvasRef, active);

  return (
    <Link
      to="/lamb-info/devotion/$devotionId"
      params={{ devotionId: entry.id }}
      className={cn(cardClass, "bg-muted")}
      {...handlers}
    >
      {/* สูงตามสัดส่วนรูปจริง — กันรูปเตี้ย/สูงเกินด้วย min/max แล้วครอปส่วนเกิน */}
      <img
        ref={imgRef}
        src={coverImage}
        alt=""
        loading="lazy"
        className="block max-h-[36rem] min-h-56 w-full object-cover"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full opacity-0 [image-rendering:pixelated]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/85 via-black/35 to-transparent"
      />
      <div
        className={cn("transition-opacity duration-200", active && "opacity-0")}
      >
        <div className="absolute top-3 left-3">
          <TypeBadge entry={entry} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="min-w-0 space-y-1.5">
            <AuthorRow entry={entry} />
            <h3 className="line-clamp-2 text-lg leading-snug font-semibold text-white">
              {entry.title}
            </h3>
          </div>
          <OpenArrow />
        </div>
      </div>
      <RevealOverlay entry={entry} active={active} className="bg-black/60" />
    </Link>
  );
}

// การ์ดไม่มีรูป: ไม่มีอะไรให้แตกเป็นพิกเซล — hover แล้วเนื้อหาเต็มโผล่ทับด้วย
// จังหวะเป็นขั้นๆ แบบเดียวกัน
function TextCard({ entry }: { entry: LambDevotionRow }) {
  const { active, handlers } = useReveal();

  return (
    <Link
      to="/lamb-info/devotion/$devotionId"
      params={{ devotionId: entry.id }}
      className={cn(
        cardClass,
        "flex flex-col gap-4 bg-linear-to-br from-slate-800 to-slate-950 p-5 ring-1 ring-white/10 ring-inset",
      )}
      {...handlers}
    >
      <div>
        <TypeBadge entry={entry} />
      </div>
      <div className="space-y-2">
        <h3 className="line-clamp-3 text-xl leading-snug font-semibold text-white">
          {entry.title}
        </h3>
        <p className="line-clamp-5 text-sm leading-relaxed text-white/70">
          {htmlToPlainTextSnippet(entry.content_html, 320)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <AuthorRow entry={entry} />
        <OpenArrow />
      </div>
      <RevealOverlay entry={entry} active={active} className="bg-slate-950" />
    </Link>
  );
}

export function DevotionFeedGallery({
  entries,
}: {
  entries: LambDevotionRow[];
}) {
  return (
    <div className="columns-1 gap-4 @xl/content:columns-2 @4xl/content:columns-3">
      {entries.map((entry) => {
        const coverImage = entry.image_urls[0];
        return coverImage ? (
          <ImageCard key={entry.id} entry={entry} coverImage={coverImage} />
        ) : (
          <TextCard key={entry.id} entry={entry} />
        );
      })}
    </div>
  );
}
