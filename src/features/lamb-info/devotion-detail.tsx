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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShareButton } from "@/features/devotion-public/components/share-button";
import { cn } from "@/lib/utils";
import { lambDisplayName } from "./data/devotion-schema";
import { useLambDevotionDetail } from "./data/queries";
import { DEVOTION_CONTENT_CLASS } from "./lib/devotion-content-class";

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
          <div className="flex items-center gap-2">
            {/* แสดงเฉพาะรายการ is_public — รายการ private ไม่มีหน้า public
            ให้แชร์ (ดู grill-me 2026-08-16) */}
            {entry?.is_public && (
              <ShareButton
                url={`${window.location.origin}/devotion/${devotionId}`}
                text={entry.title}
              />
            )}
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
                {entry.lamb_info?.profile_picture && (
                  <AvatarImage src={entry.lamb_info.profile_picture} alt="" />
                )}
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
