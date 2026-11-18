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
import { Skeleton } from "@/components/ui/skeleton";
import { DEVOTION_CONTENT_TYPE_LABELS } from "@/features/lamb-info/data/devotion-schema";
import { useLambDevotionHistory } from "@/features/lamb-info/data/queries";
import { htmlToPlainTextSnippet } from "@/features/lamb-info/lib/devotion-share-snippet";
import { useDailyBackground } from "../data/daily-background";
import { BackgroundPhoto } from "./background-photo";

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
  const { data: background } = useDailyBackground(today, "memory");

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
    <section className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-linear-to-br from-stone-700 to-stone-950 p-5 text-white ring-1 ring-white/10 ring-inset">
      {background && (
        <BackgroundPhoto
          photo={background}
          overlayClassName="bg-linear-to-t from-black/85 via-black/65 to-black/55"
        />
      )}

      <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
        <History className="size-4" />
        วันนี้ในอดีต
      </div>

      {isPending ? (
        <Skeleton className="relative h-24 w-full bg-white/15" />
      ) : picks.length === 0 ? (
        <p className="relative text-sm text-white/70">
          ยังไม่มีรายการเก่าให้ย้อนอ่าน เขียนต่อไปเรื่อยๆ
          แล้ววันหนึ่งจะได้กลับมาเห็นที่นี่
        </p>
      ) : (
        <ul className="relative space-y-1">
          {picks.map(({ entry, label }) => (
            <li key={entry.id}>
              <Link
                to="/lamb-info/devotion/$devotionId"
                params={{ devotionId: entry.id }}
                className="-mx-2 block space-y-1 rounded-md px-2 py-2 hover:bg-white/10"
              >
                <p className="text-xs text-white/70">
                  {label} ·{" "}
                  {format(parseISO(entry.devotion_date), "d MMM yyyy")} ·{" "}
                  {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
                </p>
                <p className="font-medium">{entry.title}</p>
                <p className="line-clamp-2 text-sm text-white/75">
                  {htmlToPlainTextSnippet(entry.content_html, 200)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {background && (
        <a
          href={background.pexelsUrl}
          target="_blank"
          rel="noreferrer"
          className="relative self-end text-xs text-white/60 hover:text-white"
        >
          ภาพ: {background.photographer} / Pexels
        </a>
      )}
    </section>
  );
}
