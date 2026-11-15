import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import {
  CircleCheckBig,
  MessageCircleHeart,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPrayerRequests } from "@/features/prayer-list/data/queries";
import {
  type PrayerRequest,
  prayerDurationDays,
} from "@/features/prayer-list/data/schema";

const LIST_LIMIT = 4;

function shortDate(value: string) {
  return format(parseISO(value), "d MMM yyyy");
}

function Meter({ value, total }: { value: number; total: number }) {
  return (
    <div className="bg-muted h-2 overflow-hidden rounded-full">
      <div
        className="h-full rounded-full bg-green-600 dark:bg-green-500"
        style={{ width: total > 0 ? `${(value / total) * 100}%` : 0 }}
      />
    </div>
  );
}

function BigNumber({ value, unit }: { value: number; unit: string }) {
  return (
    <p className="text-3xl font-bold tabular-nums">
      {value}
      <span className="text-muted-foreground ms-1.5 text-sm font-normal">
        {unit}
      </span>
    </p>
  );
}

// สรุปคำอธิษฐาน / สิ่งที่พระเจ้าคุยด้วย / รายชื่อแอนดรู ของตัวเอง จากตาราง
// lamb_prayer_request เดียวกับหน้า /prayer-list (แยกด้วยคอลัมน์ type) —
// แอนดรูใช้ is_answered = "รับเชื่อแล้ว" (ดู prayer-list/data/schema.ts)
export function PrayerSummary({ lambId }: { lambId: string }) {
  const { data, isPending } = useMyPrayerRequests(lambId);

  const summary = useMemo(() => {
    const all = data ?? [];
    const ofType = (type: PrayerRequest["type"]) =>
      all.filter((request) => request.type === type);
    const prayers = ofType("prayer");
    const answered = prayers
      .filter((request) => request.is_answered)
      .sort((a, b) =>
        (b.answered_date ?? "").localeCompare(a.answered_date ?? ""),
      );
    const waits = answered
      .map((request) => prayerDurationDays(request))
      .filter((days): days is number => days !== null);
    const andrew = ofType("andrew");

    return {
      prayers,
      answered,
      averageWait:
        waits.length > 0
          ? Math.round(waits.reduce((sum, d) => sum + d, 0) / waits.length)
          : null,
      conversations: ofType("conversation"),
      andrew,
      andrewBelieved: andrew.filter((request) => request.is_answered),
    };
  }, [data]);

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
    );
  }

  const {
    prayers,
    answered,
    averageWait,
    conversations,
    andrew,
    andrewBelieved,
  } = summary;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">คำอธิษฐาน</h3>
        <Button asChild variant="outline" size="sm">
          <Link to="/prayer-list">เปิดรายการคำอธิษฐาน</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircleHeart className="text-muted-foreground size-4" />
              คำอธิษฐาน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BigNumber value={prayers.length} unit="เรื่อง" />
            <div className="space-y-1.5">
              <Meter value={answered.length} total={prayers.length} />
              <p className="text-muted-foreground text-sm">
                พระเจ้าตอบแล้ว {answered.length} · ยังรอ{" "}
                {prayers.length - answered.length}
              </p>
            </div>
            {averageWait !== null && (
              <p className="text-muted-foreground text-sm">
                รอเฉลี่ย {averageWait} วันก่อนพระเจ้าตอบ
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-muted-foreground size-4" />
              สิ่งที่พระเจ้าคุยด้วย
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BigNumber value={conversations.length} unit="เรื่อง" />
            {conversations.length === 0 ? (
              <p className="text-muted-foreground text-sm">ยังไม่ได้จดไว้</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {conversations.slice(0, LIST_LIMIT).map((request) => (
                  <li key={request.id} className="flex justify-between gap-3">
                    <span className="truncate">{request.title}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {shortDate(request.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersRound className="text-muted-foreground size-4" />
              รายชื่อแอนดรู
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BigNumber value={andrew.length} unit="คน" />
            <div className="space-y-1.5">
              <Meter value={andrewBelieved.length} total={andrew.length} />
              <p className="text-muted-foreground text-sm">
                รับเชื่อแล้ว {andrewBelieved.length} · ยังอธิษฐานเผื่อ{" "}
                {andrew.length - andrewBelieved.length}
              </p>
            </div>
            {andrew.length > 0 && (
              <ul className="space-y-2 text-sm">
                {andrew.slice(0, LIST_LIMIT).map((request) => (
                  <li key={request.id} className="flex items-center gap-2">
                    <CircleCheckBig
                      className={
                        request.is_answered
                          ? "size-4 shrink-0 text-green-600 dark:text-green-400"
                          : "text-muted-foreground/40 size-4 shrink-0"
                      }
                    />
                    <span className="truncate">{request.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            คำอธิษฐานที่พระเจ้าตอบแล้วล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          {answered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              ยังไม่มีรายการที่ติ๊กว่าพระเจ้าตอบแล้ว
            </p>
          ) : (
            <ul className="divide-y">
              {answered.slice(0, LIST_LIMIT).map((request) => {
                const wait = prayerDurationDays(request);
                return (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <CircleCheckBig className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                      <span className="truncate font-medium">
                        {request.title}
                      </span>
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {request.answered_date &&
                        shortDate(request.answered_date)}
                      {wait !== null && ` · รอ ${wait} วัน`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
