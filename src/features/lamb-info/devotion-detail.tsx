import { getRouteApi, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { AlertCircle, ArrowLeft, Pencil } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { lambDisplayName } from "./data/devotion-schema";
import { useLambDevotionDetail } from "./data/queries";

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

const route = getRouteApi("/_authenticated/lamb-info/devotion/$devotionId/");

// Full-article read view for a single feed entry — opened by clicking a
// card in devotion-feed.tsx. Reads the real `lamb_devotion` table.
export function DevotionDetail() {
  const { devotionId } = route.useParams();
  const {
    data: entry,
    isPending,
    isError,
    error,
  } = useLambDevotionDetail(devotionId);

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
            <Link to="/lamb-info/devotion">
              <ArrowLeft /> กลับไปหน้าเฝ้าเดี่ยว
            </Link>
          </Button>
          {entry && (
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/lamb-info/devotion/$devotionId/edit"
                params={{ devotionId }}
              >
                <Pencil /> แก้ไข
              </Link>
            </Button>
          )}
        </div>

        {isError ? (
          <Alert variant="destructive" className="mx-auto w-full max-w-3xl">
            <AlertCircle />
            <AlertTitle>ไม่พบเฝ้าเดี่ยวนี้</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "รายการนี้อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="mx-auto w-full max-w-3xl space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <article className="mx-auto w-full max-w-3xl space-y-4">
            {entry.image_urls[0] && (
              <img
                src={entry.image_urls[0]}
                alt={entry.title}
                className="max-h-96 w-full rounded-md object-cover"
              />
            )}
            <h1 className="text-3xl font-bold md:text-4xl">{entry.title}</h1>
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {entry.lamb_info
                    ? getInitials(lambDisplayName(entry.lamb_info))
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {entry.lamb_info
                    ? lambDisplayName(entry.lamb_info)
                    : "ไม่ทราบชื่อ"}
                </div>
                <div className="text-muted-foreground text-xs">
                  {format(parseISO(entry.devotion_date), "d MMMM yyyy")}
                </div>
              </div>
            </div>

            <div
              className={
                "text-sm leading-relaxed sm:text-base " +
                "[&_p]:my-3 [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold " +
                "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
                "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 " +
                "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 " +
                "[&_blockquote]:my-3 [&_blockquote]:border-s-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:ps-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic " +
                "[&_img]:my-4 [&_img]:max-h-[480px] [&_img]:w-full [&_img]:rounded-md [&_img]:object-contain"
              }
              dangerouslySetInnerHTML={{ __html: entry.content_html }}
            />
          </article>
        )}
      </Main>
    </>
  );
}
