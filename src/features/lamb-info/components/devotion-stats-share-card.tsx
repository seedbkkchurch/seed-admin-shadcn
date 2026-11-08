import { forwardRef } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from "date-fns";
import { th } from "date-fns/locale";
import seedChurchLogo from "@/assets/seed-church-logo.png";

// สีเขียวตามโลโก้ Seed Church (เขียว #05C64F) — ล็อกเป็นค่าคงที่ ไม่ใช้สีธีม
// ของแอป เพื่อให้การ์ดเป็นแบรนด์โบสถ์เสมอไม่ว่าผู้ใช้จะตั้งธีมอะไร
// (grill-me 2026-11-08)
const GREEN = "#05C64F";
const GREEN_DARK = "#0B3D1F";
const GREEN_MID = "#1E7A43";
// พื้นการ์ดขาว (ขอเปลี่ยนจากเขียวอ่อน 2026-11-08)
const CARD_BG = "#FFFFFF";
const GREEN_OFF = "#C6ECD4";

const WEEKDAY_LABELS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

function thaiMonthYear(date: Date) {
  return `${format(date, "MMMM", { locale: th })} ${date.getFullYear() + 543}`;
}

type Props = {
  name: string;
  avatarUrl?: string | null;
  // true ในรอบ retry หลัง capture ล้ม (รูปโปรไฟล์ข้ามโดเมนโหลดไม่ได้) —
  // ใช้ตัวย่อชื่อแทนรูป เหมือน DevotionShareCard
  avatarFailed?: boolean;
  // วันนี้ — ใช้ทำวงรอบ "วันนี้" และจางวันที่ยังไม่ถึง
  today: Date;
  // เดือนที่เลือกแชร์ (วันไหนในเดือนก็ได้) — grill-me 2026-11-08 "เลือกเดือนได้"
  month: Date;
  devotionDays: Set<string>;
  monthCount: number;
  // ตัวเลขสองช่องล่าง — เดือนปัจจุบัน = อาทิตย์นี้/ปีนี้, เดือนก่อนๆ =
  // วันติดกันยาวสุดในเดือน/ทั้งปีของเดือนนั้น (คำนวณที่ปุ่มแชร์)
  bottomStats: { label: string; value: number }[];
  // ข้อพระคัมภีร์หนุนใจ (ไม่บังคับ) ที่ผู้ใช้พิมพ์ตอนแชร์ — grill-me 2026-11-08
  // ถ้ามี จะย่อตัวเลข/ปฏิทินลงเพื่อให้การ์ดยังเป็น 1080x1350 เท่าเดิม
  verse?: { text: string; reference: string } | null;
};

// การ์ดแชร์สถิติเฝ้าเดี่ยว (แบบ B "ปฏิทินจุด") — grill-me 2026-11-08:
// - แนวตั้ง 1080x1350 (4:5 เหมาะกับ LINE/ฟีด IG) เหมือน DevotionShareCard
// - บน: รูปโปรไฟล์ + ชื่อ + เดือน/ปี พ.ศ.
// - ตัวเลข "เฝ้าเดี่ยวเดือนนี้" ใหญ่ที่สุด
// - ปฏิทินจุดของเดือนนี้ (เริ่มวันจันทร์ ตรงกับ "อาทิตย์นี้") จุดเขียวเข้ม =
//   วันที่เฝ้าเดี่ยว, วันที่ยังมาไม่ถึงจางลง, วันนี้มีวงรอบ
// - ล่าง: อาทิตย์นี้ / ปีนี้ แล้วโลโก้ Seed Church มุมขวาล่าง
// ขนาดทุกอย่างเป็น px คงที่ (ไม่ใช้ Tailwind rem) ให้ภาพผลลัพธ์คงที่เสมอ
export const DevotionStatsShareCard = forwardRef<HTMLDivElement, Props>(
  function DevotionStatsShareCard(
    {
      name,
      avatarUrl,
      avatarFailed,
      today,
      month,
      devotionDays,
      monthCount,
      bottomStats,
      verse,
    },
    ref,
  ) {
    const monthDays = eachDayOfInterval({
      start: startOfMonth(month),
      end: endOfMonth(month),
    });
    // ช่องว่างก่อนวันที่ 1 ให้ตรงคอลัมน์ จ–อา (getISODay: จ=1 … อา=7)
    const leadingBlanks = getISODay(monthDays[0]) - 1;
    const showAvatar = Boolean(avatarUrl) && !avatarFailed;
    const hasVerse = Boolean(verse?.text.trim());
    // ขนาดย่อเมื่อมีข้อพระคัมภีร์ (ต้องเหลือที่ให้กล่องข้อพระคัมภีร์ ~240px)
    const bigNumberSize = hasVerse ? 140 : 200;
    const dotSize = hasVerse ? 42 : 60;
    const dotRowGap = hasVerse ? 12 : 16;

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1350,
          boxSizing: "border-box",
          padding: "80px 88px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CARD_BG,
          color: GREEN_DARK,
        }}
      >
        {/* หัว: รูปโปรไฟล์ + ชื่อ + เดือน */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <div
            style={{
              width: 184,
              height: 184,
              flexShrink: 0,
              borderRadius: 9999,
              overflow: "hidden",
              border: `6px solid ${GREEN}`,
              background: GREEN,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 700,
            }}
          >
            {showAvatar ? (
              <img
                src={avatarUrl ?? undefined}
                crossOrigin="anonymous"
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 700,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: 38, color: GREEN_MID, lineHeight: 1.4 }}>
              {thaiMonthYear(month)}
            </div>
          </div>
        </div>

        {/* ตัวเลขเดือนนี้ — ใหญ่ที่สุดบนการ์ด */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 38, color: GREEN_MID, lineHeight: 1.4 }}>
            {isSameMonth(month, today)
              ? "เฝ้าเดี่ยวเดือนนี้"
              : `เฝ้าเดี่ยวเดือน${format(month, "MMMM", { locale: th })}`}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <span
              style={{
                fontSize: bigNumberSize,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {monthCount}
            </span>
            <span style={{ fontSize: 48, color: GREEN_MID }}>ครั้ง</span>
          </div>
        </div>

        {/* ปฏิทินจุดของเดือนนี้ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(7, ${dotSize}px)`,
            columnGap: 26,
            rowGap: dotRowGap,
            justifyContent: "center",
          }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                fontSize: 24,
                color: GREEN_MID,
                lineHeight: 1.2,
              }}
            >
              {label}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }, (_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {monthDays.map((day) => {
            const done = devotionDays.has(format(day, "yyyy-MM-dd"));
            const future = isAfter(day, today) && !isSameDay(day, today);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: 9999,
                  boxSizing: "border-box",
                  background: done ? GREEN : GREEN_OFF,
                  opacity: future ? 0.45 : 1,
                  border: isToday ? `5px solid ${GREEN_DARK}` : "none",
                }}
              />
            );
          })}
        </div>

        {/* อาทิตย์นี้ / ปีนี้ */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 140,
            textAlign: "center",
          }}
        >
          {bottomStats.map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>
                {value}
              </div>
              <div style={{ fontSize: 30, color: GREEN_MID }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ข้อพระคัมภีร์หนุนใจ (ถ้าใส่มาตอนแชร์) */}
        {hasVerse && verse && (
          <div
            style={{
              background: "#F0FAF4",
              borderRadius: 28,
              padding: "28px 40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 32,
                lineHeight: 1.5,
                color: GREEN_DARK,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              “{verse.text.trim()}”
            </div>
            {verse.reference.trim() && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 28,
                  fontWeight: 700,
                  color: GREEN_MID,
                }}
              >
                {verse.reference.trim()}
              </div>
            )}
          </div>
        )}

        {/* โลโก้ Seed Church มุมขวาล่าง */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img
            src={seedChurchLogo}
            alt=""
            style={{ width: 84, height: 84, objectFit: "contain" }}
          />
          <span style={{ fontSize: 32, fontWeight: 700, color: GREEN_MID }}>
            Seed Church
          </span>
        </div>
      </div>
    );
  },
);
