import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, PenLine, Table as TableIcon } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanWriteNews, useNewsFeed } from "./data/queries";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ข่าว — landing page ของเมนู "ข่าว" ฝั่ง authenticated (มุมมองเดียวกับหน้า
// public /news แต่มี chrome ของแอปเต็ม + ปุ่มเขียน/จัดการข่าวสำหรับคนมี
// news:write) เห็นเฉพาะข่าวที่เผยแพร่แล้ว (เหมือน DevotionFeed) ดู
// news-table-page.tsx สำหรับมุมมองที่เห็นทุกสถานะ
export function NewsFeed() {
  const { data: entries, isPending, isError, error } = useNewsFeed();
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
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">ข่าว</h2>
            <p className="text-muted-foreground">ข่าวสารและประกาศทั้งหมด</p>
          </div>
          {canWrite && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="lg" asChild>
                <Link to="/news/table">
                  <TableIcon /> จัดการข่าว
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link to="/news/new">
                  <PenLine /> เขียนข่าว
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mx-auto grid w-full max-w-3xl gap-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>โหลดข่าวไม่สำเร็จ</AlertTitle>
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
              ยังไม่มีข่าวที่เผยแพร่
            </p>
          ) : (
            entries.map((entry) => {
              const authorName = entry.author
                ? (entry.author.nick_name ?? entry.author.first_name)
                : "ไม่ทราบชื่อ";
              const avatarUrl = entry.author?.profile_picture ?? null;
              const coverImage = entry.cover_image_url ?? entry.image_urls[0] ?? null;

              return (
                <Link
                  key={entry.id}
                  to="/news/$slug"
                  params={{ slug: entry.slug }}
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
                            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                            <AvatarFallback className="text-[10px]">
                              {getInitials(authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{authorName}</span>
                          {entry.news_category && (
                            <Badge variant="outline">
                              {entry.news_category.name_th}
                            </Badge>
                          )}
                          <span className="text-muted-foreground text-xs">
                            {entry.published_at
                              ? format(parseISO(entry.published_at), "d MMM yyyy")
                              : ""}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold">{entry.title}</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">
                          {entry.excerpt || stripHtml(entry.content_html)}
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
