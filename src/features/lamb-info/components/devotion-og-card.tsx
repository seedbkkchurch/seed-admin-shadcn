import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getISODay,
  isAfter,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { th } from "date-fns/locale";
import seedChurchLogo from "@/assets/seed-church-logo.png";
import {
  CARD_BG,
  GREEN,
  GREEN_DARK,
  GREEN_MID,
  GREEN_OFF,
  thaiMonthYear,
  WEEKDAY_LABELS,
} from "./devotion-stats-share-card";

type Props = {
  name: string;
  avatarUrl?: string | null;
  today: Date;
  // เดือนของเฝ้าเดี่ยวที่ถูกแชร์ (grill-me 2026-11-08)
  month: Date;
  devotionDays: Set<string>;
  monthCount: number;
  yearCount: number;
};

// การ์ดจัตุรัส 1200x1200 สำหรับ og:image ตอนแปะลิงก์เฝ้าเดี่ยวใน LINE
// (grill-me 2026-11-08) — LINE ครอปรูปพรีวิวเป็นจัตุรัส/แนวนอน การ์ดแนวตั้ง
// 4:5 (DevotionStatsShareCard) จะโดนตัดหัว/ท้าย จึงจัดใหม่เป็น:
// บน = รูปโปรไฟล์ + ชื่อ + เดือน, กลาง = ตัวเลขเดือน (ซ้าย) + ปฏิทินจุด (ขวา),
// ล่าง = โลโก้ Seed Church ใช้สี/ข้อมูลชุดเดียวกับการ์ดแชร์ ไม่มีข้อพระคัมภีร์
// render ผ่าน lib/og-card.tsx (นอก React tree ของหน้า) แล้วจับภาพ
export function DevotionOgCard({
  name,
  avatarUrl,
  today,
  month,
  devotionDays,
  monthCount,
  yearCount,
}: Props) {
  const monthDays = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const leadingBlanks = getISODay(monthDays[0]) - 1;
  const dot = 66;

  return (
    <div
      style={{
        width: 1200,
        height: 1200,
        boxSizing: "border-box",
        padding: "72px 88px 64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CARD_BG,
        color: GREEN_DARK,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div
          style={{
            width: 220,
            height: 220,
            flexShrink: 0,
            borderRadius: 9999,
            overflow: "hidden",
            border: `8px solid ${GREEN}`,
            background: GREEN,
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 80,
            fontWeight: 700,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
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
              fontSize: 88,
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          <div style={{ fontSize: 48, color: GREEN_MID, lineHeight: 1.4 }}>
            {thaiMonthYear(month)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 36,
        }}
      >
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 46, color: GREEN_MID, lineHeight: 1.3 }}>
            เฝ้าเดี่ยวเดือน{format(month, "MMMM", { locale: th })}
          </div>
          <div style={{ fontSize: 330, fontWeight: 800, lineHeight: 1 }}>
            {monthCount}
          </div>
          <div style={{ fontSize: 60, color: GREEN_MID, lineHeight: 1.3 }}>
            ครั้ง
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 42,
              color: GREEN_MID,
            }}
          >
            ทั้งปี {month.getFullYear() + 543}{" "}
            <span style={{ fontWeight: 700, color: GREEN_DARK }}>
              {yearCount}
            </span>{" "}
            ครั้ง
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(7, ${dot}px)`,
            columnGap: 14,
            rowGap: 14,
            flexShrink: 0,
          }}
        >
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              style={{
                textAlign: "center",
                fontSize: 30,
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
            return (
              <div
                key={day.toISOString()}
                style={{
                  width: dot,
                  height: dot,
                  borderRadius: 9999,
                  background: done ? GREEN : GREEN_OFF,
                  opacity: future ? 0.45 : 1,
                }}
              />
            );
          })}
        </div>
      </div>

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
          style={{ width: 124, height: 124, objectFit: "contain" }}
        />
        <span style={{ fontSize: 48, fontWeight: 700, color: GREEN_MID }}>
          Seed Church
        </span>
      </div>
    </div>
  );
}
