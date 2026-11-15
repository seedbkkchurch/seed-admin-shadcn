import { format } from "date-fns";
import { Cake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BirthdayFan } from "@/features/birthdays/components/birthday-fan";
import type { DashboardLamb } from "../data/schema";

type BirthdayThisMonthCardProps = {
  lambs: DashboardLamb[];
  today: Date;
};

// รายชื่อคนเกิดเดือนนี้แบบเต็ม ไม่จำกัดจำนวน พร้อมรูป/สิ่งที่สนใจ/วันเกิด
// และลิงก์ไปหน้าโปรไฟล์ — ตกลงใน grill-me 2026-08-14 (`dashboard_design`)
// การ์ดเดียวเต็มความกว้าง เหมือน pattern ของ devotion-overview
//
// อัปเดต 2026-08-30 (grill-me): แถวรายชื่อ (avatar/ชื่อ/วันที่) ย้ายไป
// BirthdayList ที่ใช้ร่วมกับหน้า "เดือนเกิด" แบบเลือกเดือนได้เต็มหน้า
// (features/birthdays/) — การ์ดนี้ยังคงอยู่ที่เดิม แสดงแค่เดือนปัจจุบัน
// เหมือนเดิมทุกอย่าง (ไม่ใช่ของซ้ำที่ต้องลบ)
//
// อัปเดต 2026-11-16 (grill-me 2026-11-15): เปลี่ยนจากรายชื่อเป็นพัดการ์ด
// วันเกิด (BirthdayFan) ตัวเดียวกับหน้า "เดือนเกิด" — ไม่ลิงก์ไปโปรไฟล์แล้ว
// BirthdayList (birthday-list.tsx) ไม่มีที่ใช้แล้ว ปล่อยไฟล์ไว้ไม่ลบ
export function BirthdayThisMonthCard({
  lambs,
  today,
}: BirthdayThisMonthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cake className="h-4 w-4" />
          เกิดเดือน{format(today, "MMMM")} — {lambs.length} คน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BirthdayFan lambs={lambs} month={today.getMonth()} today={today} />
      </CardContent>
    </Card>
  );
}
