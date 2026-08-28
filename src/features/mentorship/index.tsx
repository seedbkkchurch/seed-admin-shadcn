import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, HandHeart, Search as SearchIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type MentorRef } from "@/features/lamb-info/data/schema";
import {
  type MentorshipRow,
  useMentorOptions,
  useMentorshipList,
  useUpdateMentor,
} from "./data/queries";

// หน้าจัดการพี่เลี้ยง-ลูกแกะ /mentorship — grill-me 2026-08-28. ตารางรายชื่อ
// ลูกแกะทั้งหมด 1 แถว/คน + dropdown เลือกพี่เลี้ยงในแถวนั้นเลย (แก้ทันที ไม่มี
// ปุ่ม save แยก เหมือน pattern เดิมของแอปนี้ — ดู growth-progress-card,
// avatar-upload mode="immediate") เข้าถึงได้เฉพาะคนมี lamb:edit:mentor
// (team_leader/admin/super_admin) — กันซ้ำที่ route ด้วย (ดู
// routes/_authenticated/mentorship/index.tsx beforeLoad) เหมือน /news/table,
// /user-roles
function displayName(
  p: Pick<MentorRef, "nick_name" | "first_name" | "last_name">,
) {
  return (
    p.nick_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "?"
  );
}

function MentorSelectCell({
  row,
  mentorOptions,
}: {
  row: MentorshipRow;
  mentorOptions: MentorRef[] | undefined;
}) {
  const updateMentor = useUpdateMentor();

  const handleChange = (value: string) => {
    const mentorId = value === "__none__" ? null : value;
    updateMentor.mutate(
      { lambId: row.id, mentorId },
      {
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "แก้ไขพี่เลี้ยงไม่สำเร็จ",
          );
        },
      },
    );
  };

  return (
    <Select
      value={row.mentor_id ?? "__none__"}
      onValueChange={handleChange}
      disabled={updateMentor.isPending}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="เลือกพี่เลี้ยง" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">ไม่มีพี่เลี้ยง</SelectItem>
        {mentorOptions
          ?.filter((m) => m.id !== row.id)
          .map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {displayName(m)}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

export function Mentorship() {
  const [filter, setFilter] = useState("");
  const { data, isPending, isError, error } = useMentorshipList();
  const { data: mentorOptions } = useMentorOptions();

  const rows = useMemo(() => {
    if (!data) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => displayName(r).toLowerCase().includes(q));
  }, [data, filter]);

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
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <HandHeart className="size-6" /> พี่เลี้ยงลูกแกะ
            </h2>
            <p className="text-muted-foreground">
              จัดการว่าใครเป็นพี่เลี้ยงของใคร
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/mentorship-chart">ดูผังพี่เลี้ยงทั้งคริสตจักร</Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <SearchIcon className="text-muted-foreground absolute start-2.5 top-2.5 size-4" />
          <Input
            placeholder="ค้นหาชื่อลูกแกะ..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="ps-8"
          />
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>โหลดรายชื่อไม่สำเร็จ</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </AlertDescription>
          </Alert>
        ) : isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลูกแกะ</TableHead>
                  <TableHead>กลุ่มแคร์</TableHead>
                  <TableHead>พี่เลี้ยง</TableHead>
                  <TableHead className="text-end">ลูกแกะในความดูแล</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const menteeCount = rows.filter(
                    (r) => r.mentor_id === row.id,
                  ).length;
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          to="/lamb-info/$lambId"
                          params={{ lambId: row.id }}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <Avatar className="size-8">
                            <AvatarImage
                              src={row.profile_picture ?? undefined}
                            />
                            <AvatarFallback>
                              {(row.nick_name || row.first_name || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {displayName(row)}
                          </span>
                          {(row.role === "cell_leader" ||
                            row.role === "team_leader") && (
                            <Badge variant="outline" className="text-xs">
                              {row.role === "team_leader"
                                ? "ทีมผู้รับใช้หลัก"
                                : "หัวหน้าแคร์"}
                            </Badge>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.group_care_info?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <MentorSelectCell
                          row={row}
                          mentorOptions={mentorOptions}
                        />
                      </TableCell>
                      <TableCell className="text-end text-sm text-muted-foreground">
                        {menteeCount > 0 ? menteeCount : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>
    </>
  );
}
