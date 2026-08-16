import { Outlet } from "@tanstack/react-router";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/lib/utils";
import { LayoutProvider } from "@/context/layout-provider";
import { SearchProvider } from "@/context/search-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SkipToMain } from "@/components/skip-to-main";

type AuthenticatedLayoutProps = {
  children?: React.ReactNode;
};

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie("sidebar_state") !== "false";
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              "@container/content",

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              "has-data-[layout=fixed]:h-svh",

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              "peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]",

              // กันเนื้อหาโดน MobileTabBar (fixed ด้านล่าง, จอ < 768px) บัง —
              // ใช้ --mobile-tab-bar-height ค่ากลางเดียวกับที่
              // BibleQuickReferenceSheet ใช้เผื่อระยะให้ปุ่ม/แถบลอยของมัน
              // ไม่ทับ tab bar (ดู theme.css, grill-me 2026-08-16)
              "pb-[var(--mobile-tab-bar-height)] md:pb-0",
            )}
          >
            {children ?? <Outlet />}
          </SidebarInset>
          <MobileTabBar />
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  );
}
