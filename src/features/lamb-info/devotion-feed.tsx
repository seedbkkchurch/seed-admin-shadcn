import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, PenLine } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { lambDisplayName } from "./data/devotion-schema";
import { useLambDevotionFeed } from "./data/queries";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Cross-lamb เฝ้าเดี่ยว feed — landing page for the "เฝ้าเดี่ยว" sidebar
// item. Reads the real `lamb_devotion` table (see data/queries.ts /
// docs/devotion-db-design.md).
export function DevotionFeed() {
  const { data: entries, isPending, isError, error } = useLambDevotionFeed();

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
            <h2 className="text-2xl font-bold tracking-tight">เฝ้าเดี่ยว</h2>
            <p className="text-muted-foreground">
              ประวัติเฝ้าเดี่ยวของสมาชิกทุกคน
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/lamb-info/devotion/new">
              <PenLine /> เขียนเฝ้าเดี่ยว
            </Link>
          </Button>
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
              ยังไม่มีใครส่งเฝ้าเดี่ยว — เป็นคนแรกได้เลย
            </p>
          ) : (
            entries.map((entry) => {
              const lambName = entry.lamb_info
                ? lambDisplayName(entry.lamb_info)
                : "ไม่ทราบชื่อ";
              const coverImage = entry.image_urls[0] ?? null;

              return (
                <Link
                  key={entry.id}
                  to="/lamb-info/devotion/$devotionId"
                  params={{ devotionId: entry.id }}
                  className="block"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
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
                          className="h-24 w-32 shrink-0 rounded-md object-cover"
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
