import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewsCategoryManager } from "./components/news-category-manager";
import { NewsTable } from "./components/news-table";
import { useNewsTable } from "./data/queries";

// จัดการข่าว — ทุกสถานะ (draft/published/archived) + หมวดหมู่ ในหน้าเดียว
// เข้าถึงได้เฉพาะคนมี news:write (route beforeLoad เช็คไว้ที่
// routes/_authenticated/news/table.tsx) โครง Tabs เดียวกับ
// features/user-roles/index.tsx
export function NewsTablePage() {
  const { data, isPending, isError, error } = useNewsTable();

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
          <h2 className="text-2xl font-bold tracking-tight">จัดการข่าว</h2>
          <p className="text-muted-foreground">
            ข่าวทั้งหมด (รวมร่างและที่เก็บถาวรแล้ว) และหมวดหมู่ข่าว
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
          <Tabs defaultValue="news" className="flex-1">
            <TabsList>
              <TabsTrigger value="news">ข่าวทั้งหมด</TabsTrigger>
              <TabsTrigger value="categories">หมวดหมู่</TabsTrigger>
            </TabsList>

            <TabsContent value="news" className="flex flex-1 flex-col gap-4">
              <NewsTable data={data ?? []} />
            </TabsContent>

            <TabsContent value="categories" className="flex flex-1 flex-col gap-4">
              <NewsCategoryManager />
            </TabsContent>
          </Tabs>
        )}
      </Main>
    </>
  );
}
