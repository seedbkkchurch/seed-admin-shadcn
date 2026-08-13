import { useMemo } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import { getRouteApi } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { ConfigDrawer } from "@/components/config-drawer";
import { DatePicker } from "@/components/date-picker";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupCareList } from "@/features/group-care/data/queries";
import { AttendanceTable } from "./components/attendance-table";

const route = getRouteApi("/_authenticated/attendance/");

// ปัดวันที่ที่เลือกลงไปยัง "วันอาทิตย์" ของสัปดาห์นั้น — week_start เริ่มนับจาก
// วันอาทิตย์เสมอตามที่ตกลงใน docs/attendance-db-design.md (โบสถ์เกิดวันอาทิตย์
// เป๊ะ, แคร์เกิดวันอื่นในสัปดาห์เดียวกัน)
function toWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 });
}

export function Attendance() {
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const { data: groups, isPending, isError, error } = useGroupCareList();

  // กลุ่ม/สัปดาห์ sync ลง URL search params (?group=&week=) แทนการเก็บเป็น
  // React state เฉยๆ — เพื่อไม่ให้เสีย state ตอนกด link ไปดูโปรไฟล์แกะแล้วกด
  // back กลับมา (ดู grill-me 2026-08-13, `docs/attendance-db-design.md`)
  const activeGroupId = search.group ?? groups?.[0]?.id;
  const selectedDate = useMemo(
    () => toWeekStart(search.week ? parseISO(search.week) : new Date()),
    [search.week],
  );
  const weekStart = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate],
  );

  const handleGroupChange = (value: string) => {
    navigate({ search: (prev) => ({ ...prev, group: value }) });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    navigate({
      search: (prev) => ({
        ...prev,
        week: format(toWeekStart(date), "yyyy-MM-dd"),
      }),
    });
  };

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
            เช็คชื่อรายสัปดาห์
          </h2>
          <p className="text-muted-foreground">
            บันทึกการมาโบสถ์และมากลุ่มแคร์ของสมาชิกแต่ละกลุ่มแคร์รายสัปดาห์
          </p>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดรายชื่อกลุ่มแคร์ไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "เกิดข้อผิดพลาด"}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <Skeleton className="h-10 w-full" />
        ) : !groups || groups.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            ยังไม่มีกลุ่มแคร์ในระบบ — ไปสร้างกลุ่มแคร์ก่อนที่หน้า Group Care
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">กลุ่มแคร์</span>
                <Select value={activeGroupId} onValueChange={handleGroupChange}>
                  <SelectTrigger className="w-60">
                    <SelectValue placeholder="เลือกกลุ่มแคร์" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  สัปดาห์ (นับจากวันอาทิตย์ {weekStart})
                </span>
                <DatePicker
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                />
              </div>
            </div>

            {activeGroupId && (
              <AttendanceTable groupId={activeGroupId} weekStart={weekStart} />
            )}
          </>
        )}
      </Main>
    </>
  );
}
