import { useMemo } from "react";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildMonthlyWeeks, type RateBucket } from "../lib/aggregate";
import { type DevotionOverviewMember } from "../data/schema";

type DevotionMonthlyTableProps = {
  today: Date;
  members: DevotionOverviewMember[];
  entriesByLamb: Map<string, Set<string>>;
};

function RateCell({ bucket }: { bucket: RateBucket }) {
  if (bucket.percent === null) {
    return <span className="text-sm text-muted-foreground">–</span>;
  }
  return (
    <div className="flex flex-col items-center leading-tight">
      <span
        className={cn(
          "text-sm font-semibold",
          bucket.percent >= 80
            ? "text-green-600 dark:text-green-500"
            : bucket.percent >= 50
              ? "text-foreground"
              : "text-destructive",
        )}
      >
        {bucket.percent}%
      </span>
      <span className="text-[11px] text-muted-foreground">
        {bucket.count}/{bucket.elapsedDays}
      </span>
    </div>
  );
}

// ตารางรายเดือน — คอลัมน์ "สัปดาห์" ยืดหดตามจำนวนสัปดาห์จริงของเดือนนี้ (4-6
// คอลัมน์ ไม่ใช่ Week 1-5 ตายตัว) ตัวเลขหลักในแต่ละช่องคือ % เทียบกับจำนวนวันที่
// ผ่านไปแล้วจริงของสัปดาห์นั้น แก้ปัญหา "จำนวนวันไม่เท่ากัน" ที่เป็นจุดเริ่ม
// ของ grill-me นี้ (ดู lib/aggregate.ts และ project memory
// `devotion_overview_design`, 2026-08-14)
export function DevotionMonthlyTable({
  today,
  members,
  entriesByLamb,
}: DevotionMonthlyTableProps) {
  const weekLabels = useMemo(
    () => buildMonthlyWeeks(today, new Set(), today).map((w) => w.label),
    [today],
  );

  const rows = useMemo(
    () =>
      members.map((member) => ({
        member,
        weeks: buildMonthlyWeeks(
          today,
          entriesByLamb.get(member.id) ?? new Set(),
          today,
        ),
      })),
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
              {weekLabels.map((label) => (
                <TableHead key={label} className="text-center">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ member, weeks }) => {
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
                  {weeks.map((bucket) => (
                    <TableCell key={bucket.label} className="text-center">
                      <RateCell bucket={bucket} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        ตารางของเดือน {format(today, "MMMM yyyy")} — % คำนวณจากจำนวนวันที่ผ่านไป
        แล้วจริงของแต่ละสัปดาห์ (ไม่นับวันในอนาคต)
      </p>
    </div>
  );
}
