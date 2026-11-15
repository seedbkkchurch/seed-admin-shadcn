import { useMemo } from "react";
import { isValid, parseISO } from "date-fns";
import { Cake } from "lucide-react";
import type { DashboardLamb } from "@/features/dashboard/data/schema";
import {
  type RoadmapItem,
  RoadmapFan,
} from "@/features/roadmap/components/roadmap-fan";
import { useInterestPhotos } from "../data/interest-photo";

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

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

// profile_picture ที่ใช้เป็นรูปได้ต้องเป็น URL จริง — ข้อมูลเก่าหลายแถวเก็บเป็น
// ตัวเลขล้วน (เช่น "28") ซึ่งโหลดเป็นรูปไม่ได้ (ตรวจจาก DB 2026-11-16: สมาชิก
// ที่ยังอยู่ มี URL จริง 10 คน เป็นตัวเลข 17 คน) นับเป็น "ไม่มีรูปโปรไฟล์"
// แล้วใช้รูปจากสิ่งที่สนใจแทน
function profilePhotoUrl(lamb: DashboardLamb): string | null {
  const value = lamb.profile_picture?.trim();
  return value && /^https?:\/\//i.test(value) ? value : null;
}

type BirthdayFanProps = {
  /** คนที่เกิดในเดือนนั้น เรียงตามวันที่แล้ว (computeBirthdaysInMonth) */
  lambs: DashboardLamb[];
  /** เดือนที่แสดง 0-11 */
  month: number;
  today: Date;
  emptyMessage?: string;
};

// พัดการ์ดวันเกิด (grill-me 2026-11-15) — ใช้ RoadmapFan ตัวเดียวกับการ์ด
// เฝ้าเดี่ยว (/roadmap) แทนรายชื่อ BirthdayList เดิม ทั้งหน้า /birthdays และ
// การ์ด "เกิดเดือนนี้" บน Dashboard:
// - ทุกคนของเดือนอยู่ในพัดเดียว เรียงตามวันที่เกิด (ซ้าย → ขวา)
// - รูปโปรไฟล์คลุมเต็มใบ ไม่มีรูปโปรไฟล์ใช้รูปจาก Pexels ตามสิ่งที่สนใจ
//   อย่างแรก (data/interest-photo.ts) ค้นไม่เจอใช้พื้นไล่สีชมพู + ไอคอนเค้ก
// - HAPPY BIRTHDAY ตัวใหญ่กลางบนการ์ด (headline — ย้ายจากป้ายเล็กเหนือชื่อ
//   2026-11-16) ตัวอักษรชิดล่าง: ชื่อเล่น → ชื่อจริง-นามสกุล → วันเดือนปีเกิด
//   ค.ศ. + อายุที่ครบปีนี้ → สิ่งที่สนใจ (บรรทัดละรายการ ตัดที่ 1 บรรทัด)
// - ใบหน้าสุดตอนเปิด: เดือนปัจจุบัน = คนที่เกิดวันนี้/วันเกิดจะถึงถัดไป
//   (ผ่านหมดแล้วใช้คนสุดท้าย) เดือนอื่น = คนแรกของเดือน
// - คลิกการ์ดไม่พาไปไหน (ไม่ส่ง onOpen) — member/visitor เปิดโปรไฟล์คนอื่น
//   ไม่ได้อยู่แล้ว เลยให้ทุก role เหมือนกัน
export function BirthdayFan({
  lambs,
  month,
  today,
  emptyMessage = "ไม่มีสมาชิกเกิดเดือนนี้",
}: BirthdayFanProps) {
  const photos = useInterestPhotos(
    useMemo(() => lambs.filter((lamb) => !profilePhotoUrl(lamb)), [lambs]),
  );

  const thisYear = today.getFullYear();
  const items = useMemo<RoadmapItem[]>(
    () =>
      lambs.flatMap((lamb) => {
        const date = lamb.birthday ? parseISO(lamb.birthday) : null;
        if (!date || !isValid(date)) return [];

        const fullName = [lamb.first_name, lamb.last_name]
          .filter(Boolean)
          .join(" ");
        const age = thisYear - date.getFullYear();
        const dateText = `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
        const profilePhoto = profilePhotoUrl(lamb);
        const interestPhoto = profilePhoto ? undefined : photos.get(lamb.id);

        const details = [
          // มีชื่อเล่นเป็นหัวข้อแล้วค่อยแสดงชื่อจริงเป็นบรรทัดรอง
          lamb.nick_name && fullName ? fullName : null,
          age > 0 ? `${dateText} • ครบ ${age} ปี` : dateText,
          lamb.interesting?.trim() ? `สนใจ: ${lamb.interesting.trim()}` : null,
        ].filter((line): line is string => !!line);

        return [
          {
            id: lamb.id,
            title: lamb.nick_name || fullName || "-",
            month: THAI_MONTHS_SHORT[date.getMonth()],
            day: String(date.getDate()),
            dateLabel: `วันเกิด ${dateText}`,
            icon: Cake,
            tone: "rose",
            imageUrl: profilePhoto ?? interestPhoto?.imageUrl,
            headline: "HAPPY\nBIRTHDAY",
            details,
            credit: interestPhoto
              ? `ภาพ: ${interestPhoto.photographer} / Pexels`
              : undefined,
          } satisfies RoadmapItem,
        ];
      }),
    [lambs, photos, thisYear],
  );

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  let defaultActiveIndex = 0;
  if (month === today.getMonth()) {
    const upcoming = items.findIndex(
      (item) => Number(item.day) >= today.getDate(),
    );
    defaultActiveIndex = upcoming === -1 ? items.length - 1 : upcoming;
  }

  return (
    <div className="flex flex-col items-center overflow-x-clip pt-2 pb-6">
      {/* key: เปลี่ยนเดือน/จำนวนคนแล้วตั้งใบหน้าสุดใหม่ */}
      <RoadmapFan
        key={`${month}-${items.length}`}
        items={items}
        defaultActiveIndex={defaultActiveIndex}
      />
    </div>
  );
}
