import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { exportDevotionDailyExcel } from "../lib/export-devotion-daily";
import { buildMonthDays, buildMonthOptions } from "../lib/aggregate";
import { type DevotionOverviewMember } from "../data/schema";

type DevotionDailyTableProps = {
  today: Date;
  members: DevotionOverviewMember[];
  entriesByLamb: Map<string, Set<string>>;
};

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

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function displayName(m: DevotionOverviewMember) {
  return m.nick_name || [m.first_name, m.last_name].filter(Boolean).join(" ");
}

// ตาราง Grid วันที่ 1-N ของเดือนที่เลือก (แถว = สมาชิก, คอลัมน์ = วันที่)
// พร้อม dropdown เลือกเดือนย้อนหลังได้ 12 เดือน + ปุ่ม export excel — ตกลงใน
// grill-me "รายงานนับเฝ้าเดี่ยวรายเดือน" 2026-08-28 ต่างจาก DevotionMonthlyTable
// (สัปดาห์/%) ด้านบน ตัวนี้โชว์ราย "วัน" ตรงๆ ให้เห็นชัดว่าส่งวันไหนบ้าง — ใช้
// entriesByLamb ชุดเดียวกับตารางอื่น (366 วันย้อนหลัง ครอบคลุม 12 เดือนพอดี)
// ไม่ query ซ้ำ, สมาชิกจำกัดแค่ active ปัจจุบัน (คู่กับตารางอื่นในแท็บนี้)
export function DevotionDailyTable({
  today,
  members,
  entriesByLamb,
}: DevotionDailyTableProps) {
  const monthOptions = useMemo(() => buildMonthOptions(today), [today]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [isExporting, setIsExporting] = useState(false);

  const rows = useMemo(
    () =>
      members.map((member) => ({
        member,
        days: buildMonthDays(
          selectedMonth,
          today,
          entriesByLamb.get(member.id) ?? new Set(),
        ),
      })),
    [members, entriesByLamb, selectedMonth, today],
  );

  const dayNumbers = rows[0]?.days.map((d) => d.dayNum) ?? [];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportDevotionDailyExcel({ monthDate: selectedMonth, rows });
    } catch {
      toast.error("Export excel ไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีสมาชิก active ในระบบ
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          value={monthKey(selectedMonth)}
          onValueChange={(v) => {
            const found = monthOptions.find((m) => monthKey(m) === v);
            if (found) setSelectedMonth(found);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={monthKey(m)} value={monthKey(m)}>
                {THAI_MONTHS[m.getMonth()]} {m.getFullYear()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="size-4" />
          {isExporting ? "กำลัง Export..." : "Export Excel"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-40 bg-background">
                ชื่อ
              </TableHead>
              {dayNumbers.map((n) => (
                <TableHead key={n} className="w-8 px-1 text-center">
                  {n}
                </TableHead>
              ))}
              <TableHead className="text-center">รวม</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ member, days }) => (
              <TableRow key={member.id}>
                <TableCell className="sticky left-0 z-10 bg-background">
                  <Link
                    to="/lamb-info/$lambId"
                    params={{ lambId: member.id }}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={member.profile_picture ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(member.nick_name || member.first_name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{displayName(member)}</span>
                  </Link>
                </TableCell>
                {days.map((d) => (
                  <TableCell key={d.dayNum} className="p-1 text-center">
                    {!d.isFuture && (
                      <div
                        className={cn(
                          "mx-auto size-5 rounded-sm",
                          d.present
                            ? "bg-green-500 dark:bg-green-600"
                            : "bg-muted",
                        )}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-center text-sm font-semibold">
                  {days.filter((d) => d.present).length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
