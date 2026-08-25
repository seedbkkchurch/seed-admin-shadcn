import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowLeft, Pencil } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/features/devotion-public/components/share-button";
import { DEVOTION_CONTENT_CLASS } from "@/features/lamb-info/lib/devotion-content-class";
import { cn } from "@/lib/utils";
import { useCanWriteNews, useNewsDetail } from "./data/queries";
import { NEWS_STATUS_LABELS } from "./data/schema";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// มุมมองเต็มบทความแบบ authenticated — เปิดได้ทุกสถานะถ้า RLS อนุญาต (คนมี
// news:write เห็นได้หมดรวม draft/archived ใช้ preview ก่อนเผยแพร่จริง คนอื่น
// เห็นได้เฉพาะ published — ดู queries.ts) ใช้ DEVOTION_CONTENT_CLASS ร่วมกับ
// เฝ้าเดี่ยว (เนื้อหามาจาก ArticleEditor ตัวเดียวกัน สไตล์เนื้อหาต้องตรงกัน)
// หมายเหตุ: component นี้ไม่มี route ผูกอยู่แล้ว (เดิมคือ
// /_authenticated/news/$newsId ถูกลบไปแก้บัก router ชนกัน 2026-08-25) รับ
// newsId เป็น prop แทน getRouteApi เพื่อไม่ให้ build พังจากการอ้างอิง route
// ที่ไม่มีอยู่จริง — ตอนนี้เป็นไฟล์ orphaned ไม่มีใคร import ใช้งาน
export function NewsDetail({ newsId }: { newsId: string }) {
  const { data: entry, isPending, isError, error } = useNewsDetail(newsId);
  const { data: canWrite } = useCanWriteNews();

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/news">
              <ArrowLeft /> กลับไปหน้าข่าว
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {entry?.status === "published" && (
              <ShareButton
                url={`${window.location.origin}/news/${entry.slug}`}
                text={entry.title}
              />
            )}
            {entry && canWrite && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/news/$newsId/edit" params={{ newsId }}>
                  <Pencil /> แก้ไข
                </Link>
              </Button>
            )}
          </div>
        </div>

        {isError ? (
          <Alert variant="destructive" className="mx-auto w-full max-w-3xl">
            <AlertCircle />
            <AlertTitle>ไม่พบข่าวนี้</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "รายการนี้อาจถูกเก็บถาวรไปแล้ว หรือไม่มีสิทธิ์เข้าถึง"}
            </AlertDescription>
          </Alert>
        ) : isPending || !entry ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <article className="mx-auto w-full max-w-3xl space-y-4">
            {entry.status !== "published" && (
              <Badge variant="secondary">
                {NEWS_STATUS_LABELS[entry.status] ?? entry.status}
              </Badge>
            )}
            {(entry.cover_image_url || entry.image_urls[0]) && (
              <img
                src={entry.cover_image_url ?? entry.image_urls[0]}
                alt={entry.title}
                className="max-h-96 w-full rounded-md object-cover"
              />
            )}
            <h1 className="text-3xl font-bold md:text-4xl">{entry.title}</h1>
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                {entry.author?.profile_picture && (
                  <AvatarImage src={entry.author.profile_picture} alt="" />
                )}
                <AvatarFallback className="text-xs">
                  {entry.author
                    ? getInitials(entry.author.nick_name ?? entry.author.first_name)
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {entry.author
                    ? (entry.author.nick_name ?? entry.author.first_name)
                    : "ไม่ทราบผู้เขียน"}
                </div>
                <div className="text-muted-foreground text-xs">
                  {entry.published_at
                    ? format(parseISO(entry.published_at), "d MMMM yyyy")
                    : format(parseISO(entry.created_at), "d MMMM yyyy")}
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
        )}
      </Main>
    </>
  );
}
