import { getRouteApi, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Main } from "@/components/layout/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEVOTION_CONTENT_TYPE_LABELS,
  lambDisplayName,
} from "@/features/lamb-info/data/devotion-schema";
import { usePublicLambDevotionDetail } from "@/features/lamb-info/data/queries";
import { DEVOTION_CONTENT_CLASS } from "@/features/lamb-info/lib/devotion-content-class";
import { cn } from "@/lib/utils";
import { PublicHeader } from "./components/public-header";
import { ShareButton } from "./components/share-button";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const route = getRouteApi("/devotion/$devotionId/");

// Public mirror ของ features/lamb-info/devotion-detail.tsx — ต่างจากตัวเดิม
// ตรงที่ (1) query ใหม่ usePublicLambDevotionDetail กรอง is_public=true
// ชัดเจน (ตัวเดิม useLambDevotionDetail ไม่กรอง เพราะฝั่ง admin ต้องดูได้
// ทั้ง public/private) กัน URL หลุด/เดา id รายการ private ได้ (2) ไม่มีปุ่ม
// "แก้ไข" (3) มีปุ่มแชร์ไป LINE แทน — ดู grill-me 2026-08-16
export function DevotionPublicDetail() {
  const { devotionId } = route.useParams();
  const {
    data: entry,
    isPending,
    isError,
    error,
  } = usePublicLambDevotionDetail(devotionId);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <PublicHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/devotion">
              <ArrowLeft /> กลับไปหน้าเฝ้าเดี่ยว
            </Link>
          </Button>
          {entry && <ShareButton url={shareUrl} text={entry.title} />}
        </div>

        {isError ? (
          <Alert variant="destructive" className="mx-auto w-full max-w-3xl">
            <AlertCircle />
            <AlertTitle>ไม่พบเฝ้าเดี่ยวนี้</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "รายการนี้อาจไม่ใช่สาธารณะ ถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          (() => {
            // view คืน first/last name แบบ nullable (left join + คอลัมน์ DB
            // เองก็ nullable) — lambDisplayName เดิมรับ first/last แบบ
            // non-null เท่านั้น ต่างจาก LambDevotionRow ปกติที่การันตีไม่ null
            // ผ่าน type override (ดู PublicDevotionFeedEntry comment) จึงต้อง
            // เช็คเองตรงนี้แทน แสดง "ไม่ทราบชื่อ" ถ้าไม่มีทั้งสองชื่อ
            const lambName =
              entry.lamb_first_name && entry.lamb_last_name
                ? lambDisplayName({
                    nick_name: entry.lamb_nick_name,
                    first_name: entry.lamb_first_name,
                    last_name: entry.lamb_last_name,
                  })
                : null;

            return (
              <article className="mx-auto w-full max-w-3xl space-y-4">
                {entry.image_urls[0] && (
                  <img
                    src={entry.image_urls[0]}
                    alt={entry.title}
                    className="max-h-96 w-full rounded-md object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  {/* badge ประเภท — เพิ่มโดย grill-me 2026-08-26 */}
                  <Badge variant="secondary">
                    {DEVOTION_CONTENT_TYPE_LABELS[entry.content_type]}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold md:text-4xl">
                  {entry.title}
                </h1>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    {entry.lamb_profile_picture && (
                      <AvatarImage src={entry.lamb_profile_picture} alt="" />
                    )}
                    <AvatarFallback className="text-xs">
                      {lambName ? getInitials(lambName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {lambName ?? "ไม่ทราบชื่อ"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {format(parseISO(entry.devotion_date), "d MMMM yyyy")}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "text-sm leading-relaxed sm:text-base",
                    DEVOTION_CONTENT_CLASS,
                  )}
                  dangerouslySetInnerHTML={{ __html: entry.content_html }}
                />
              </article>
            );
          })()
        )}
      </Main>
    </>
  );
}
