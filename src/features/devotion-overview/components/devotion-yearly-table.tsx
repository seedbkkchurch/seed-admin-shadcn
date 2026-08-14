import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { averagePercent, buildYearlyMonths, type RateBucket } from "../lib/aggregate";
import { type DevotionOverviewMember } from "../data/schema";

type DevotionYearlyTableProps = {
  today: Date;
  members: DevotionOverviewMember[];
  entriesByLamb: Map<string, Set<string>>;
};

// แท่งเขียวสไตล์เดียวกับที่ผู้ใช้ส่งมาในรูปตัวอย่าง (สรุปรายปี) — ความยาวแท่ง
// เขียวแปรผันตาม % จริง, ตัวเลข % ซ้อนอยู่กลางแท่ง อ่านง่ายกว่าตัวเลขล้วนตอน scan
// ทีละแถวข้ามหลายเดือน (ตกลงใน grill-me 2026-08-14)
function MonthBar({ bucket }: { bucket: RateBucket }) {
  if (bucket.percent === null) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-2 flex-1 rounded-full bg-muted" />
        <span className="w-8 shrink-0 text-right text-[11px] text-muted-foreground">
          –
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-green-500 dark:bg-green-600"
          style={{ width: `${bucket.percent}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-[11px] font-medium text-muted-foreground">
        {bucket.percent}%
      </span>
    </div>
  );
}

// ตารางรายปี — 12 เดือนล่าสุดแบบ rolling (ไม่มีตัวเลือกเลื่อนปี) คอลัมน์
// "เฉลี่ยทั้งปี" ท้ายตารางคือค่าเฉลี่ยของเดือนที่เริ่มไปแล้วเท่านั้น (ไม่รวม
// เดือนที่ elapsedDays=0 ซึ่งไม่มีในชุด 12 เดือนล่าสุดอยู่แล้ว แต่กันไว้เผื่อ)
export function DevotionYearlyTable({
  today,
  members,
  entriesByLamb,
}: DevotionYearlyTableProps) {
  const monthLabels = useMemo(
    () => buildYearlyMonths(today, new Set()).map((m) => m.label),
    [today],
  );

  const rows = useMemo(
    () =>
      members.map((member) => {
        const months = buildYearlyMonths(
          today,
          entriesByLamb.get(member.id) ?? new Set(),
        );
        return { member, months, avg: averagePercent(months) };
      }),
    [members, entriesByLamb, today],
  );

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        ยังไม่มีสมาชิก active ในระบบ
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สมาชิก</TableHead>
              {monthLabels.map((label) => (
                <TableHead key={label} className="w-20 text-center">
                  {label}
                </TableHead>
              ))}
              <TableHead className="text-center">เฉลี่ยทั้งปี</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ member, months, avg }) => {
              const displayName =
                member.nick_name || `${member.first_name} ${member.last_name}`;
              const subtitleParts = [
                member.gender,
                member.group_care_info?.name,
              ].filter(Boolean);

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      to="/lamb-info/$lambId"
                      params={{ lambId: member.id }}
                      className="flex min-w-0 items-center gap-2 hover:underline"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={member.profile_picture ?? undefined} />
                        <AvatarFallback>
                          {(member.nick_name || member.first_name || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {displayName}
                        </div>
                        {subtitleParts.length > 0 && (
                          <div className="truncate text-xs text-muted-foreground">
                            {subtitleParts.join(" • ")}
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  {months.map((bucket, i) => (
                    <TableCell key={`${bucket.label}-${i}`} className="p-1.5">
                      <MonthBar bucket={bucket} />
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    {avg === null ? (
                      <span className="text-sm text-muted-foreground">–</span>
                    ) : (
                      <Badge variant="secondary">{avg}%</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        ย้อนหลัง 12 เดือนล่าสุดจากวันนี้ — % คำนวณจากจำนวนวันที่ผ่านไปแล้วจริงของ
        แต่ละเดือน (ไม่นับวันในอนาคต)
      </p>
    </div>
  );
}
