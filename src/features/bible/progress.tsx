import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookProgressRow } from "./components/book-progress-row";
import {
  ReadingProgressRing,
  TestamentLegend,
} from "./components/reading-progress-ring";
import { useMyReadingProgress } from "./hooks/use-my-reading-progress";
import {
  type BookProgress,
  LAST_OLD_TESTAMENT_BOOK,
} from "./lib/reading-progress";

// หน้าเต็ม "ความคืบหน้าการอ่านพระคัมภีร์" (/bible/progress, grill-me
// 2026-11-16) — ของคนที่ล็อกอินเท่านั้น: วงกลมรวม + สัดส่วนเดิม/ใหม่ แล้วแถบ
// ครบ 66 เล่มแยกพันธสัญญาเดิม/ใหม่ กดเล่มเพื่อดูตารางเลขบท เข้าจากปุ่ม "ดู
// ทั้งหมด" บนการ์ดสรุปในหน้า /spiritual (ไม่มีเมนู sidebar) หน้าแสดงความ
// คืบหน้าของคนอื่นยังไม่ทำในรอบนี้
export function BibleProgressPage() {
  const { lambId, progress, isLoading, error } = useMyReadingProgress();
  const [expandedBook, setExpandedBook] = useState<number | null>(null);

  const renderBooks = (items: BookProgress[]) => (
    <div className="grid items-start gap-2 lg:grid-cols-2">
      {items.map((item) => (
        <BookProgressRow
          key={item.book.number}
          item={item}
          expanded={expandedBook === item.book.number}
          onToggle={() =>
            setExpandedBook((current) =>
              current === item.book.number ? null : item.book.number,
            )
          }
        />
      ))}
    </div>
  );

  return (
    <>
      <Header fixed>
        <Search className="me-auto" />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className="flex flex-1 flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              ความคืบหน้าการอ่านพระคัมภีร์
            </h2>
            <p className="text-muted-foreground">
              นับเมื่อเลื่อนอ่านถึงท้ายบท บทละไม่เกิน 1 ครั้งต่อวัน
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link
              to="/bible/$book/$chapter"
              params={{ book: "1", chapter: "1" }}
            >
              <ArrowLeft />
              ไปหน้าพระคัมภีร์
            </Link>
          </Button>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : !lambId || !progress ? (
          <p className="text-muted-foreground py-8 text-center">
            บัญชีนี้ยังไม่ได้ผูกกับข้อมูลสมาชิก จึงไม่มีความคืบหน้าให้แสดง
          </p>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
                <ReadingProgressRing progress={progress} />
                <div className="w-full flex-1 space-y-4">
                  <TestamentLegend progress={progress} />
                  <p className="text-muted-foreground text-sm">
                    อ่านครบแล้ว {progress.booksDone} จาก {progress.books.length}{" "}
                    เล่ม · กำลังอ่านค้าง {progress.inProgress.length} เล่ม
                  </p>
                </div>
              </CardContent>
            </Card>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">พันธสัญญาเดิม</h3>
              {renderBooks(
                progress.books.filter(
                  (item) => item.book.number <= LAST_OLD_TESTAMENT_BOOK,
                ),
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">พันธสัญญาใหม่</h3>
              {renderBooks(
                progress.books.filter(
                  (item) => item.book.number > LAST_OLD_TESTAMENT_BOOK,
                ),
              )}
            </section>
          </>
        )}
      </Main>
    </>
  );
}
