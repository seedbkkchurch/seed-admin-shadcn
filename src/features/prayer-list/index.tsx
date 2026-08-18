import { useState } from "react";
import { Plus } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMyLamb } from "@/hooks/use-my-lamb";
import { PrayerRequestFormDialog } from "./components/prayer-request-form-dialog";
import { PrayerRequestList } from "./components/prayer-request-list";
import { useMyPrayerRequests } from "./data/queries";
import {
  PRAYER_ENTRY_TYPE_LABEL,
  PRAYER_ENTRY_TYPES,
  type PrayerEntryType,
} from "./data/schema";

// หน้า "รายการคำอธิษฐาน" — self-service, ลูกแกะกรอกเองผ่านบัญชีที่ผูกกับ
// lamb_info.auth_user_id (เหมือน DevotionEditor/Subscribe/MobileTabBar อื่นๆ
// ที่ auto-detect lamb จาก auth แทน manual picker) แยก 2 tab ตายตัว —
// คำอธิษฐาน กับ สิ่งที่พระเจ้าคุยด้วย — ตกลงใน grill-me session, ดู
// docs/prayer-list-db-design.md
export function PrayerList() {
  const {
    data: myLamb,
    isResolvingUser,
    isPending: isLambPending,
  } = useMyLamb();
  const { data: requests, isPending, isError, error } = useMyPrayerRequests(
    myLamb?.id,
  );
  const [createDialogType, setCreateDialogType] =
    useState<PrayerEntryType | null>(null);

  const isLoadingLamb = isResolvingUser || isLambPending;

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
          <h2 className="text-2xl font-bold tracking-tight">
            รายการคำอธิษฐาน
          </h2>
          <p className="text-muted-foreground">
            จดคำอธิษฐานและสิ่งที่พระเจ้าคุยด้วย แล้วติ๊กเมื่อพระเจ้าตอบแล้ว
          </p>
        </div>

        {isLoadingLamb ? (
          <Skeleton className="h-40 w-full" />
        ) : !myLamb ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            ไม่พบบัญชีลูกแกะที่ผูกกับผู้ใช้นี้ — ฟีเจอร์นี้ใช้ได้เฉพาะบัญชีที่ผูกกับลูกแกะแล้วเท่านั้น
          </p>
        ) : (
          <Tabs defaultValue="prayer" className="gap-4">
            <TabsList>
              {PRAYER_ENTRY_TYPES.map((type) => (
                <TabsTrigger key={type} value={type}>
                  {PRAYER_ENTRY_TYPE_LABEL[type]}
                </TabsTrigger>
              ))}
            </TabsList>

            {PRAYER_ENTRY_TYPES.map((type) => (
              <TabsContent
                key={type}
                value={type}
                className="flex flex-col gap-4"
              >
                <div className="flex justify-end">
                  <Button onClick={() => setCreateDialogType(type)}>
                    <Plus /> เพิ่ม{PRAYER_ENTRY_TYPE_LABEL[type]}
                  </Button>
                </div>

                {isError ? (
                  <p className="text-sm text-destructive">
                    โหลดรายการไม่สำเร็จ:{" "}
                    {error instanceof Error ? error.message : "เกิดข้อผิดพลาด"}
                  </p>
                ) : isPending ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <PrayerRequestList
                    lambId={myLamb.id}
                    type={type}
                    requests={(requests ?? []).filter((r) => r.type === type)}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </Main>

      {myLamb && createDialogType && (
        <PrayerRequestFormDialog
          open
          lambId={myLamb.id}
          type={createDialogType}
          onOpenChange={(open) => !open && setCreateDialogType(null)}
        />
      )}
    </>
  );
}
