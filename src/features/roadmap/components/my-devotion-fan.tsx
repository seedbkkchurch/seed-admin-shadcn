import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Church,
  HandHeart,
  type LucideIcon,
  NotebookPen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEVOTION_CONTENT_TYPE_LABELS,
  type DevotionContentType,
} from "@/features/lamb-info/data/devotion-schema";
import { useLambDevotionHistory } from "@/features/lamb-info/data/queries";
import { htmlToPlainTextSnippet } from "@/features/lamb-info/lib/devotion-share-snippet";
import { type RoadmapItem, type RoadmapTone, RoadmapFan } from "./roadmap-fan";

// พัดออกแบบมา 6 ใบ (ชั้นลึกสุดคือ depth 5) — แสดงทีละ 6 รายการ
const PAGE_SIZE = 6;

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

// สีพื้นไล่เฉดของการ์ดที่ไม่มีรูป — 3 สีต่างกันชัดตามประเภท (grill-me
// 2026-11-15): เฝ้าเดี่ยว น้ำเงินคราม→ม่วง, คำเทศนา ส้มอำพัน→แดงอิฐ,
// ขอบคุณพระเจ้า เขียวมรกต→เขียวน้ำทะเล (ค่าสีอยู่ใน roadmap-fan.css)
const CONTENT_TYPE_TONES: Record<DevotionContentType, RoadmapTone> = {
  devotion: "indigo",
  sermon: "amber",
  thanksgiving: "emerald",
};

// ไอคอนบนการ์ดสีสำหรับรายการที่ไม่มีรูป — แยกตามประเภท
const CONTENT_TYPE_ICONS: Record<DevotionContentType, LucideIcon> = {
  devotion: NotebookPen,
  sermon: Church,
  thanksgiving: HandHeart,
};

// หน้าการ์ดพัด "เฝ้าเดี่ยวของฉัน" (grill-me 2026-11-14) — เดิมหน้านี้เป็น
// roadmap "เร็วๆ นี้" ข้อมูลตัวอย่าง เปลี่ยนมาแสดงรายการของคนที่ล็อกอินเอง
// จาก lamb_devotion โดยคงหน้าตาการ์ดเดิมไว้:
// - ของตัวเองเท่านั้น (useMyLamb → useLambDevotionHistory) รวมรายการส่วนตัว
//   ด้วย เพราะเจ้าของอ่านของตัวเองได้ตาม RLS
// - ทั้ง 3 ประเภท (เฝ้าเดี่ยว/คำเทศนา/ขอบคุณพระเจ้า) มีป้ายบอกประเภทเหนือ
//   หัวข้อ
// - ทีละ 6 ใบล่าสุด ใหม่สุดอยู่หน้า มีปุ่มเลื่อนไปชุดที่เก่ากว่า/ใหม่กว่า
// - รูปแรกของรายการคลุมเต็มการ์ด ตัวอักษรทับบนรูป ไม่มีรูปใช้พื้นไล่สี +
//   ไอคอนตามประเภท (ออกแบบใหม่ 2026-11-15 — เดิมการ์ดขาว รูปอยู่กลางใบ)
// - ใต้หัวข้อมีเนื้อหาย่อ 2 บรรทัด (เพิ่ม 2026-11-15)
// - hover/แตะ = ดึงการ์ดขึ้นมาหน้า, คลิกใบหน้าสุด = เปิดอ่านรายการนั้น
// URL (/roadmap) กับตำแหน่งเมนู (กลุ่ม Admin) ยังคงเดิมไว้ก่อน
// embedded = วางเป็นส่วนหนึ่งของหน้าอื่น (หน้าจิตวิญญาณของฉัน /spiritual,
// 2026-11-15): หัวข้อเล็กลงเป็นระดับ section และไม่ยืดเต็มความสูงของหน้า
// ไม่ใส่ = ใช้ทั้งหน้าแบบ /roadmap เดิม
export function MyDevotionFan({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const myLamb = useMyLamb();
  const lambId = myLamb.data?.id;
  const history = useLambDevotionHistory(lambId);
  // page 0 = 6 รายการล่าสุด, page 1 = 6 รายการก่อนหน้านั้น, …
  const [page, setPage] = useState(0);

  // query เรียงเก่า → ใหม่ตาม devotion_date อยู่แล้ว ซึ่งตรงกับลำดับในพัด
  // (ซ้าย = เก่า, ขวา/หน้าสุด = ใหม่)
  const entries = useMemo(() => history.data ?? [], [history.data]);
  const total = entries.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const end = total - safePage * PAGE_SIZE;
  const start = Math.max(0, end - PAGE_SIZE);

  const items = useMemo<RoadmapItem[]>(
    () =>
      entries.slice(start, end).map((entry) => {
        const date = parseISO(entry.devotion_date);
        const typeLabel = DEVOTION_CONTENT_TYPE_LABELS[entry.content_type];
        return {
          id: entry.id,
          title: entry.title,
          month: THAI_MONTHS_SHORT[date.getMonth()],
          day: String(date.getDate()),
          dateLabel: `${typeLabel} ${format(date, "d/M/yyyy")}`,
          icon: CONTENT_TYPE_ICONS[entry.content_type],
          tone: CONTENT_TYPE_TONES[entry.content_type],
          imageUrl: entry.image_urls[0],
          eyebrow: entry.is_public ? typeLabel : `${typeLabel} · ส่วนตัว`,
          // เนื้อหาเฝ้าเดี่ยวแบบย่อ 2 บรรทัดใต้หัวข้อ (CSS ตัดบรรทัดให้เอง —
          // ตัดความยาวไว้ก่อนแค่กันข้อความยาวเกินจำเป็นใน DOM)
          description: htmlToPlainTextSnippet(entry.content_html, 160),
        };
      }),
    [entries, start, end],
  );

  const isLoading =
    myLamb.isResolvingUser ||
    myLamb.isLoading ||
    (!!lambId && history.isPending);
  const error = myLamb.error ?? history.error;

  return (
    <div
      className={cn(
        "flex flex-col gap-8 overflow-x-clip sm:gap-10",
        !embedded && "flex-1",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          {embedded ? (
            <h3 className="text-lg font-semibold">เฝ้าเดี่ยวของฉัน</h3>
          ) : (
            <h2 className="text-2xl font-bold tracking-tight">
              เฝ้าเดี่ยวของฉัน
            </h2>
          )}
          <p className="text-muted-foreground">
            ชี้หรือแตะการ์ดเพื่อดูแต่ละรายการ แล้วกดการ์ดใบหน้าสุดเพื่อเปิดอ่าน
          </p>
        </div>
        {lambId && total > 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/lamb-info/$lambId/devotion" params={{ lambId }}>
              ดูทั้งหมด
            </Link>
          </Button>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col items-center justify-center gap-6 pb-10",
          !embedded && "flex-1",
        )}
      >
        {isLoading ? (
          <Skeleton className="aspect-[4/5] w-[400px] max-w-[85%] rounded-[28px]" />
        ) : error ? (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : !lambId ? (
          <p className="text-muted-foreground text-center">
            บัญชีนี้ยังไม่ได้ผูกกับข้อมูลสมาชิก จึงไม่มีเฝ้าเดี่ยวให้แสดง
          </p>
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-muted-foreground">
              ยังไม่มีเฝ้าเดี่ยว เริ่มเขียนรายการแรกได้เลย
            </p>
            <Button asChild>
              <Link to="/lamb-info/devotion/new">เขียนเฝ้าเดี่ยว</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* key ตามหน้า: เปลี่ยนชุดการ์ดแล้วให้ใบใหม่สุดของชุดกลับมาอยู่หน้า */}
            <RoadmapFan
              key={safePage}
              items={items}
              onOpen={(item) =>
                navigate({
                  to: "/lamb-info/devotion/$devotionId",
                  params: { devotionId: item.id },
                })
              }
            />

            {pageCount > 1 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                >
                  <ChevronLeft />
                  เก่ากว่า
                </Button>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {start + 1}–{end} จาก {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                >
                  ใหม่กว่า
                  <ChevronRight />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
