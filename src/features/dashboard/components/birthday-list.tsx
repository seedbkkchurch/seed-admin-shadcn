import { format, parseISO } from "date-fns";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DashboardLamb } from "../data/schema";

type BirthdayListProps = {
  lambs: DashboardLamb[];
  emptyMessage?: string;
};

// Avatar/name/date grid shared by BirthdayThisMonthCard (Dashboard, always
// current month) and the standalone "เดือนเกิด" page (features/birthdays/,
// any month via a dropdown) — extracted so both stay pixel-identical
// (grill-me 2026-08-30, "ทำเหมือนเดือนเกิดในหน้า dashboard เลย").
export function BirthdayList({
  lambs,
  emptyMessage = "ไม่มีสมาชิกเกิดเดือนนี้",
}: BirthdayListProps) {
  if (lambs.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {lambs.map((lamb) => {
        const displayName =
          lamb.nick_name || `${lamb.first_name} ${lamb.last_name}`;
        const birthdayDate = lamb.birthday ? parseISO(lamb.birthday) : null;

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
  );
}
