import ExcelJS from "exceljs";
import { type DailyCell } from "./aggregate";
import { type DevotionOverviewMember } from "../data/schema";

// สร้างไฟล์ excel ตารางเฝ้าเดี่ยวรายวันของเดือนที่เลือก โครงสร้างเดียวกับ
// ตารางบนจอ (DevotionDailyTable) เป๊ะๆ — ชื่อ/กลุ่มแคร์/ช่องวันที่ 1-N ระบายสี
// เขียว-เทา/รวม — ตกลงใน grill-me "รายงานนับเฝ้าเดี่ยวรายเดือน" 2026-08-28
// ทำงานฝั่ง browser ล้วน (ไม่มี backend server ในโปรเจกต์นี้) ใช้ exceljs
// เพราะรองรับ cell fill color ตรงไปตรงมากว่า SheetJS community edition
const GREEN_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFBBF7D0" }, // tailwind green-200 — พอสำหรับพื้นหลังตาราง
};
const GRAY_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE5E7EB" }, // tailwind gray-200
};

// ชื่อไฟล์ export ใช้ชื่อเดือนไทย + ปี ค.ศ. ตามที่ตกลง (ไม่ใช่ปีพุทธศักราช) —
// ไม่มี util นี้อยู่แล้วในโปรเจกต์ จึงประกาศไว้เฉพาะที่นี่
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

function thaiMonthYear(monthDate: Date): string {
  return `${THAI_MONTHS[monthDate.getMonth()]}-${monthDate.getFullYear()}`;
}

function displayName(m: DevotionOverviewMember) {
  return m.nick_name || [m.first_name, m.last_name].filter(Boolean).join(" ");
}

export async function exportDevotionDailyExcel({
  monthDate,
  rows,
}: {
  monthDate: Date;
  rows: { member: DevotionOverviewMember; days: DailyCell[] }[];
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(thaiMonthYear(monthDate));

  const dayCount = rows[0]?.days.length ?? 0;

  sheet.columns = [
    { header: "ชื่อ", key: "name", width: 20 },
    { header: "กลุ่มแคร์", key: "group", width: 16 },
    ...Array.from({ length: dayCount }, (_, i) => ({
      header: String(i + 1),
      key: `d${i + 1}`,
      width: 4,
    })),
    { header: "รวม", key: "total", width: 8 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 2 }];

  for (const { member, days } of rows) {
    const total = days.filter((d) => d.present).length;
    const rowValues: Record<string, string | number> = {
      name: displayName(member),
      group: member.group_care_info?.name ?? "-",
      total,
    };
    days.forEach((_, i) => {
      rowValues[`d${i + 1}`] = "";
    });
    const row = sheet.addRow(rowValues);

    days.forEach((d, i) => {
      const cell = row.getCell(`d${i + 1}`);
      if (d.isFuture) return; // เว้นว่างไม่ระบายสี — วันยังไม่ถึง
      cell.fill = d.present ? GREEN_FILL : GRAY_FILL;
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `เฝ้าเดี่ยว-${thaiMonthYear(monthDate)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
