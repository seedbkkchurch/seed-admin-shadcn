import { getRouteApi, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LambDevotionTable } from "./components/lamb-devotion-table";
import { lambDisplayName } from "./data/devotion-schema";
import { useLambDevotionTable, useLambInfoDetail } from "./data/queries";

const route = getRouteApi("/_authenticated/lamb-info/$lambId/devotion");

// Full เฝ้าเดี่ยว history for one lamb — a sortable/filterable table with
// image thumbnails, opened via "ดูทั้งหมด" on the profile page's
// devotion-section.tsx (replaces the earlier scrollable-list dialog). Per
// grill-me follow-up (2026-08-11).
export function LambDevotionTablePage() {
  const { lambId } = route.useParams();
  const { data: lamb, isPending: isLambPending } = useLambInfoDetail(lambId);
  const { data, isPending, isError, error } = useLambDevotionTable(lambId);

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/lamb-info/$lambId" params={{ lambId }}>
              <ArrowLeft /> กลับไปโปรไฟล์
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            ประวัติเฝ้าเดี่ยวทั้งหมด
            {!isLambPending && lamb ? ` — ${lambDisplayName(lamb)}` : ""}
          </h2>
          <p className="text-muted-foreground">
            รายการเฝ้าเดี่ยวทั้งหมดของคนนี้ (รวมที่ตั้งเป็นส่วนตัว)
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <LambDevotionTable data={data} />
        )}
      </Main>
    </>
  );
}
