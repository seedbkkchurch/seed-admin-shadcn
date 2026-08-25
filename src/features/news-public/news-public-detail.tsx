import { getRouteApi, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowLeft, Pencil } from "lucide-react";
import { Main } from "@/components/layout/main";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/features/devotion-public/components/share-button";
import { DEVOTION_CONTENT_CLASS } from "@/features/lamb-info/lib/devotion-content-class";
import { useCanWriteNews, usePublicNewsDetail } from "@/features/news/data/queries";
import { cn } from "@/lib/utils";
import { NewsPublicHeader } from "./components/news-public-header";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const route = getRouteApi("/news/$slug/");

// Public mirror ของ features/news/news-detail.tsx — query
// usePublicNewsDetail กรอง status='published' ผ่าน view เสมอ (URL ไม่ใช่
// draft/archived หลุดออกมาได้), ไม่มีปุ่มแก้ไข, มีปุ่มแชร์ไป LINE — โครง
// เดียวกับ features/devotion-public/devotion-public-detail.tsx
export function NewsPublicDetail() {
  const { slug } = route.useParams();
  const { data: entry, isPending, isError, error } = usePublicNewsDetail(slug);
  const { data: canWrite } = useCanWriteNews();

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <NewsPublicHeader />

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/news">
              <ArrowLeft /> กลับไปหน้าข่าว
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {entry && <ShareButton url={shareUrl} text={entry.title} />}
            {entry && canWrite && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/news/$newsId/edit" params={{ newsId: entry.id }}>
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
                : "รายการนี้อาจยังไม่ได้เผยแพร่ ถูกเก็บถาวรแล้ว หรือลิงก์ไม่ถูกต้อง"}
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
            const authorName =
              entry.author_nick_name ?? entry.author_first_name ?? null;
            const coverImage = entry.cover_image_url ?? entry.image_urls[0] ?? null;

            return (
              <article className="mx-auto w-full max-w-3xl space-y-4">
                {entry.category_name && (
                  <Badge variant="outline">{entry.category_name}</Badge>
                )}
                {coverImage && (
                  <img
                    src={coverImage}
                    alt={entry.title}
                    className="max-h-96 w-full rounded-md object-cover"
                  />
                )}
                <h1 className="text-3xl font-bold md:text-4xl">{entry.title}</h1>
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    {entry.author_profile_picture && (
                      <AvatarImage src={entry.author_profile_picture} alt="" />
                    )}
                    <AvatarFallback className="text-xs">
                      {authorName ? getInitials(authorName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">
                      {authorName ?? "ไม่ทราบชื่อ"}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {entry.published_at
                        ? format(parseISO(entry.published_at), "d MMMM yyyy")
                        : ""}
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
