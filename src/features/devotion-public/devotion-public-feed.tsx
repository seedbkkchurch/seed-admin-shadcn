import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Main } from "@/components/layout/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEVOTION_CONTENT_TYPE_LABELS } from "@/features/lamb-info/data/devotion-schema";
import { usePublicDevotionFeed } from "@/features/lamb-info/data/queries";
import { PublicHeader } from "./components/public-header";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Public mirror ของ features/lamb-info/devotion-feed.tsx — ต่างกันตรง (1)
// ไม่ต้อง login/ไม่มี sidebar/chrome ของแอป (2) ไม่มีปุ่ม "เขียนเฝ้าเดี่ยว"
// (การเขียนยังต้อง login เสมอ) (3) การ์ดลิงก์ไปหน้า /devotion/$id (public)
// แทน /lamb-info/devotion/$id (authenticated) — ดู grill-me 2026-08-16
//
// เดิม reuse useLambDevotionFeed (query ตรงตาราง lamb_devotion) แต่ตารางนั้น
// เปิด RLS ไว้เฉพาะ role authenticated เท่านั้น (ไม่มี policy ให้ anon เลย —
// ดู comment ยาวใน data/queries.ts) เปลี่ยนมาใช้ usePublicDevotionFeed
// (อ่านจาก DB view public_devotion_feed) แทน — คืนชื่อลูกแกะแบบ flat column
// (lamb_nick_name/lamb_first_name/lamb_last_name) ไม่ใช่ nested lamb_info
// object เหมือน useLambDevotionFeed เดิม (view ไม่มี FK ให้ PostgREST embed)
export function DevotionPublicFeed() {
  const { data: entries, isPending, isError, error } = usePublicDevotionFeed();

  return (
    <>
      <PublicHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">เฝ้าเดี่ยว</h2>
          <p className="text-muted-foreground">
            ประวัติเฝ้าเดี่ยวของสมาชิกที่เปิดเป็นสาธารณะ
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-3xl gap-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>โหลดเฝ้าเดี่ยวไม่สำเร็จ</AlertTitle>
              <AlertDescription>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </AlertDescription>
            </Alert>
          ) : isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center text-sm">
              ยังไม่มีเฝ้าเดี่ยวที่เปิดเป็นสาธารณะ
            </p>
          ) : (
            entries.map((entry) => {
              // การ์ดโชว์แค่ชื่อเล่น (fallback ชื่อจริง) ไม่มีนามสกุล — ตาม
              // devotion-feed.tsx เดิม (grill-me follow-up 2026-08-14) view
              // คืน flat column ไม่ใช่ nested lamb_info เหมือนตัวเดิม
              const lambName =
                entry.lamb_nick_name ?? entry.lamb_first_name ?? "ไม่ทราบชื่อ";
              const avatarUrl = entry.lamb_profile_picture ?? null;
              const coverImage = entry.image_urls[0] ?? null;

              return (
                <Link
                  key={entry.id}
                  to="/devotion/$devotionId"
                  params={{ devotionId: entry.id }}
                  className="block"
                >
                  <Card className="overflow-hidden py-0 transition-colors hover:bg-muted/50 sm:py-6">
                    {coverImage && (
                      <img
                        src={coverImage}
                        alt={entry.title}
                        className="aspect-video w-full object-cover sm:hidden"
                      />
                    )}
                    <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:py-0">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Avatar className="size-6">
                            {avatarUrl && (
                              <AvatarImage src={avatarUrl} alt="" />
                            )}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(lambName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {lambName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {format(
                              parseISO(entry.devotion_date),
                              "d MMM yyyy",
                            )}
                          </span>
                          {/* badge ประเภท — เพิ่มโดย grill-me 2026-08-26 */}
                          <Badge variant="secondary">
                            {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {stripHtml(entry.content_html)}
                        </p>
                      </div>
                      {coverImage && (
                        <img
                          src={coverImage}
                          alt={entry.title}
                          className="hidden h-24 w-32 shrink-0 rounded-md object-cover sm:block"
                        />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </Main>
    </>
  );
}
