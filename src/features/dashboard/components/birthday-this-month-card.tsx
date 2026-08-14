import { format, parseISO } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Cake } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardLamb } from "../data/schema";

type BirthdayThisMonthCardProps = {
  lambs: DashboardLamb[];
  today: Date;
};

// รายชื่อคนเกิดเดือนนี้แบบเต็ม ไม่จำกัดจำนวน พร้อมรูป/สิ่งที่สนใจ/วันเกิด
// และลิงก์ไปหน้าโปรไฟล์ — ตกลงใน grill-me 2026-08-14 (`dashboard_design`)
// การ์ดเดียวเต็มความกว้าง เหมือน pattern ของ devotion-overview
export function BirthdayThisMonthCard({ lambs, today }: BirthdayThisMonthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cake className="h-4 w-4" />
          เกิดเดือน{format(today, "MMMM")} — {lambs.length} คน
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lambs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ไม่มีสมาชิกเกิดเดือนนี้
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lambs.map((lamb) => {
              const displayName =
                lamb.nick_name || `${lamb.first_name} ${lamb.last_name}`;
              const birthdayDate = lamb.birthday
                ? parseISO(lamb.birthday)
                : null;

              return (
                <Link
                  key={lamb.id}
                  to="/lamb-info/$lambId"
                  params={{ lambId: lamb.id }}
                  className="flex min-w-0 items-center gap-3 rounded-md border p-2 hover:bg-muted"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={lamb.profile_picture ?? undefined} />
                    <AvatarFallback>
                      {(lamb.nick_name || lamb.first_name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{displayName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {birthdayDate ? format(birthdayDate, "d MMM") : "-"}
                      {lamb.interesting ? ` • ${lamb.interesting}` : ""}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
