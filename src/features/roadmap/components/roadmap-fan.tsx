import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import "./roadmap-fan.css";

export type RoadmapItem = {
  id: string;
  /** ขึ้นบรรทัดใหม่ได้ด้วย "\n" (white-space: pre-line) */
  title: string;
  /** บรรทัดบนของป้ายวันที่ เช่น "ธ.ค." หรือ "เร็วๆ นี้" */
  month: string;
  /** บรรทัดล่างของป้ายวันที่ — ไม่ใส่ก็ได้ (เช่นป้าย "เร็วๆ นี้") */
  day?: string;
  /** ไอคอนกลางการ์ด — ใช้เมื่อไม่มี imageUrl หรือรูปโหลดไม่ขึ้น */
  icon: LucideIcon;
  /** รูปกลางการ์ด (แทนไอคอน) */
  imageUrl?: string;
  /** ป้ายเล็กเหนือหัวข้อ เช่น ประเภทของรายการ */
  eyebrow?: string;
  /** ข้อความย่อใต้หัวข้อ — ตัดที่ 2 บรรทัด (มีแล้วหัวข้อจะเหลือ 1 บรรทัด) */
  description?: string;
  /** ข้อความวันที่เต็มสำหรับ screen reader — ไม่ใส่จะใช้ day + month */
  dateLabel?: string;
};

type RoadmapFanProps = {
  items: RoadmapItem[];
  /** index ของการ์ดที่อยู่หน้าสุดตอนเปิดหน้า — ค่าเริ่มต้นคือใบสุดท้าย */
  defaultActiveIndex?: number;
  /** คลิก/แตะการ์ดที่อยู่หน้าสุดแล้ว — ใบหลังคลิกครั้งแรกแค่ดึงขึ้นมาหน้า */
  onOpen?: (item: RoadmapItem) => void;
  className?: string;
};

// ค่าทั้งหมดด้านล่างวัดจาก capture (ดู roadmap-fan.css)
const CARD_WIDTH = 320;
const MAX_DEPTH = 5;
// ระยะเลื่อนแนวนอนสะสมของการ์ดชั้นที่ d เทียบกับใบหน้าสุด
const SPREAD = [0, 69, 135, 198, 258, 314];
const Z_INDEX = [20, 16, 14, 12, 11, 10];
// ช่องว่างท้ายพัด: capture กว้าง 651px = 314 (spread) + 320 (การ์ด) + 17
const END_GUTTER = 17;
const SWIPE_THRESHOLD = 40;
// เมาส์ต้องค้างบนการ์ดนานเท่านี้ก่อนการ์ดจะเลื่อนขึ้นมา — กันการ์ดกระพริบ
// ตอนลากเมาส์ผ่านเร็วๆ
const HOVER_INTENT_MS = 90;
// หลังสลับการ์ดแล้ว ไม่รับ hover ใหม่ชั่วครู่ เพราะการ์ดกำลังเลื่อนผ่านใต้
// เมาส์ (ไม่งั้นการ์ดที่เลื่อนผ่านจะถูกนับว่าโดน hover แล้วสลับต่อเป็นทอดๆ)
const HOVER_LOCK_MS = 450;

function spread(depth: number) {
  return SPREAD[depth] ?? Math.round(72 * depth - 1.5 * depth * (depth + 1));
}

// ตำแหน่ง/มุมของการ์ดแต่ละใบ: ใบที่มาก่อนใบหน้าสุดแผ่ไปทางซ้าย (เอียงซ้าย)
// ใบที่มาหลังแผ่ไปทางขวา (เอียงขวา) แบบกระจกเงา
function getPose(index: number, activeIndex: number, count: number) {
  const offset = index - activeIndex;
  const distance = Math.abs(offset);
  const depth = Math.min(distance, MAX_DEPTH);
  const side = offset < 0 ? "start" : offset > 0 ? "end" : "active";

  const before = activeIndex;
  const after = count - 1 - activeIndex;
  // จัดให้ทั้งพัดอยู่กลางพื้นที่ — ถ้าไม่มีใบทางขวาเลยจะได้ 314px ตรงกับ capture
  const activeX =
    spread(before) + (spread(count - 1) - spread(before) - spread(after)) / 2;

  let x = activeX;
  if (side === "start") x = activeX - spread(distance);
  // การ์ดชั้นลึกแคบลงใบละ 16px เลยต้องชดเชยให้ขอบขวาเป็นตัวที่แผ่ออก
  if (side === "end") x = activeX + spread(distance) + 16 * depth;

  return {
    depth,
    side,
    x,
    y: 1 + 11 * distance,
    rotate: (side === "end" ? 0.5 : -0.5) * distance,
  };
}

export function RoadmapFan({
  items,
  defaultActiveIndex,
  onOpen,
  className,
}: RoadmapFanProps) {
  const [activeIndex, setActiveIndex] = useState(
    defaultActiveIndex ?? items.length - 1,
  );
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const hoverTarget = useRef<number | null>(null);
  const hoverLockedUntil = useRef(0);

  const cancelHover = () => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    hoverTarget.current = null;
  };

  useEffect(() => cancelHover, []);

  // เอาเมาส์ชี้การ์ดใบไหน ใบนั้นค่อยๆ เลื่อนขึ้นมาหน้าสุด (เดิมต้องคลิก —
  // เปลี่ยนตามคำขอ 2026-11-14) ใช้ pointermove แทน mouseenter เพื่อให้หลัง
  // ช่วงล็อก ขยับเมาส์นิดเดียวก็จับการ์ดที่อยู่ใต้เมาส์ได้เลย จอสัมผัสไม่มี
  // hover ยังใช้แตะ/ปัดเหมือนเดิม
  const handlePointerMove = (
    index: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.pointerType !== "mouse") return;
    if (index === activeIndex) {
      cancelHover();
      return;
    }
    if (hoverTarget.current === index) return;
    // event.timeStamp ใช้นาฬิกาเดียวกับ performance.now()
    if (event.timeStamp < hoverLockedUntil.current) return;

    cancelHover();
    hoverTarget.current = index;
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null;
      hoverTarget.current = null;
      hoverLockedUntil.current = performance.now() + HOVER_LOCK_MS;
      setActiveIndex(index);
    }, HOVER_INTENT_MS);
  };

  const goTo = (index: number, focus = false) => {
    const next = Math.max(0, Math.min(items.length - 1, index));
    setActiveIndex(next);
    if (focus) cardRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1, true);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1, true);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    goTo(activeIndex + (deltaX < 0 ? 1 : -1));
  };

  const fanWidth = CARD_WIDTH + spread(items.length - 1) + END_GUTTER;

  return (
    <div className={cn("roadmap-fan-container", className)}>
      <BoilFilters />

      <div
        className="roadmap-fan"
        role="presentation"
        style={{ "--fan-width": `${fanWidth}px` } as CSSProperties}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => {
          const pose = getPose(index, activeIndex, items.length);
          const isActive = index === activeIndex;
          const dateLabel =
            item.dateLabel ?? [item.day, item.month].filter(Boolean).join(" ");

          return (
            <div
              key={item.id}
              className="roadmap-fan__slot"
              data-has-description={item.description ? "" : undefined}
              data-depth={pose.depth}
              data-side={pose.side}
              style={
                {
                  "--depth": pose.depth,
                  "--z": Z_INDEX[pose.depth],
                } as CSSProperties
              }
            >
              <button
                ref={(node) => {
                  cardRefs.current[index] = node;
                }}
                type="button"
                className="roadmap-fan__card"
                aria-label={`${item.title.replace(/\n/g, " ")}, ${dateLabel}`}
                aria-current={isActive ? "true" : undefined}
                style={
                  {
                    "--pose-x": `${pose.x}px`,
                    "--pose-y": `${pose.y}px`,
                    "--pose-rotate": `${pose.rotate}deg`,
                  } as CSSProperties
                }
                onClick={() => {
                  if (isActive && onOpen) onOpen(item);
                  else goTo(index);
                }}
                onPointerMove={(event) => handlePointerMove(index, event)}
                onPointerLeave={cancelHover}
              >
                <span className="roadmap-fan__visual">
                  <FanArt item={item} />
                </span>
                <span className="roadmap-fan__copy" aria-hidden="true">
                  {item.eyebrow && (
                    <span className="roadmap-fan__eyebrow">{item.eyebrow}</span>
                  )}
                  <span className="roadmap-fan__title">{item.title}</span>
                  {item.description && (
                    <span className="roadmap-fan__description">
                      {item.description}
                    </span>
                  )}
                </span>
                <span className="roadmap-fan__badge" aria-hidden="true">
                  <span className="roadmap-fan__month">{item.month}</span>
                  {item.day && (
                    <span className="roadmap-fan__day">{item.day}</span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* จุดบอกตำแหน่ง — เฉพาะโหมดจอแคบ ที่เห็นการ์ดทีละใบ */}
      <div className="roadmap-fan__dots mt-6 items-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`ไปที่การ์ด ${index + 1} จาก ${items.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === activeIndex
                ? "w-5 bg-foreground"
                : "w-1.5 bg-foreground/20",
            )}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </div>
  );
}

// ภาพกลางการ์ด: รูปของรายการถ้ามี ไม่มี (หรือโหลดไม่ขึ้น) ใช้ไอคอนเส้น
function FanArt({ item }: { item: RoadmapItem }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const Icon = item.icon;
  const showImage = !!item.imageUrl && failedUrl !== item.imageUrl;

  return (
    <span
      className="roadmap-fan__art"
      data-kind={showImage ? "image" : "icon"}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setFailedUrl(item.imageUrl ?? null)}
        />
      ) : (
        <Icon strokeWidth={0.75} />
      )}
    </span>
  );
}

// SVG filter 3 ตัว (noise คนละ seed) ให้ภาพประกอบของใบหน้าสุดสั่นแบบเส้น
// วาดมือ — สลับกันด้วย keyframes roadmap-fan-boil ใน roadmap-fan.css
function BoilFilters() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0">
      <defs>
        {[3, 11, 27].map((seed, index) => (
          <filter key={seed} id={`roadmap-fan-boil-${index}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="2"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
