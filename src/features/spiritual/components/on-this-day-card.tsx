import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
  getDayOfYear,
  parseISO,
} from "date-fns";
import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEVOTION_CONTENT_TYPE_LABELS } from "@/features/lamb-info/data/devotion-schema";
import { useLambDevotionHistory } from "@/features/lamb-info/data/queries";
import { htmlToPlainTextSnippet } from "@/features/lamb-info/lib/devotion-share-snippet";

const LIMIT = 3;
// รายการที่ "ย้อนอ่าน" แบบสุ่มต้องเก่ากว่านี้ — ไม่หยิบของที่เพิ่งเขียน
const REVISIT_MIN_AGE_DAYS = 30;

// "วันนี้ในอดีต": ของตัวเองที่เขียนวันเดียวกันนี้ของปีก่อนๆ → ถ้าไม่มี เอาวันที่
// เดียวกันของเดือนก่อนๆ → ถ้าไม่มีอีก หยิบรายการเก่ามาหนึ่งอันให้ย้อนอ่าน
// (เลือกจากวันที่ของปี ทั้งวันจึงได้รายการเดิม ไม่เปลี่ยนทุกครั้งที่เปิดหน้า)
export function OnThisDayCard({
  lambId,
  today,
}: {
  lambId: string;
  today: Date;
}) {
  const { data, isPending } = useLambDevotionHistory(lambId);

  const picks = useMemo(() => {
    const entries = (data ?? []).map((entry) => ({
      entry,
      date: parseISO(entry.devotion_date),
    }));
    const past = entries.filter(({ date }) => date < today);
    const newestFirst = (a: { date: Date }, b: { date: Date }) =>
      b.date.getTime() - a.date.getTime();

    const sameDayOfYear = past
      .filter(
        ({ date }) =>
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate() &&
          date.getFullYear() < today.getFullYear(),
      )
      .sort(newestFirst)
      .map(({ entry, date }) => ({
        entry,
        label: `${differenceInCalendarYears(today, date)} ปีที่แล้ว`,
      }));
    if (sameDayOfYear.length > 0) return sameDayOfYear.slice(0, LIMIT);

    const sameDayOfMonth = past
      .filter(
        ({ date }) =>
          date.getDate() === today.getDate() &&
          differenceInCalendarMonths(today, date) >= 1,
      )
      .sort(newestFirst)
      .map(({ entry, date }) => ({
        entry,
        label: `${differenceInCalendarMonths(today, date)} เดือนที่แล้ว`,
      }));
    if (sameDayOfMonth.length > 0) return sameDayOfMonth.slice(0, LIMIT);

    const old = past.filter(
      ({ date }) =>
        differenceInCalendarDays(today, date) >= REVISIT_MIN_AGE_DAYS,
    );
    if (old.length === 0) return [];
    const { entry } = old[getDayOfYear(today) % old.length];
    return [{ entry, label: "ย้อนอ่าน" }];
  }, [data, today]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="text-muted-foreground size-4" />
          วันนี้ในอดีต
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : picks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            ยังไม่มีรายการเก่าให้ย้อนอ่าน เขียนต่อไปเรื่อยๆ
            แล้ววันหนึ่งจะได้กลับมาเห็นที่นี่
          </p>
        ) : (
          <ul className="space-y-3">
            {picks.map(({ entry, label }) => (
              <li key={entry.id}>
                <Link
                  to="/lamb-info/devotion/$devotionId"
                  params={{ devotionId: entry.id }}
                  className="hover:bg-muted -mx-2 block space-y-1 rounded-md px-2 py-2"
                >
                  <p className="text-muted-foreground text-xs">
                    {label} ·{" "}
                    {format(parseISO(entry.devotion_date), "d MMM yyyy")} ·{" "}
                    {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
                  </p>
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {htmlToPlainTextSnippet(entry.content_html, 200)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
