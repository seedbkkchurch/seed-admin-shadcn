import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAttendanceMembers,
  useAttendanceWeek,
  useUpsertAttendance,
} from "../data/queries";
import { type AttendanceMember } from "../data/schema";

type AttendanceTableProps = {
  groupId: string;
  weekStart: string; // yyyy-MM-dd ของวันอาทิตย์ของสัปดาห์นั้น
};

export function AttendanceTable({ groupId, weekStart }: AttendanceTableProps) {
  const {
    data: members,
    isPending: isMembersPending,
    isError: isMembersError,
  } = useAttendanceMembers(groupId);
  const {
    data: attendance,
    isPending: isAttendancePending,
    isError: isAttendanceError,
  } = useAttendanceWeek(groupId, weekStart);
  const upsertAttendance = useUpsertAttendance(groupId);

  // ค่า note ที่กำลังพิมพ์อยู่ก่อน blur — เก็บแยกจาก query cache เพื่อไม่ให้ค่า
  // กระโดดกลับตอนพิมพ์ (query จะ refetch ทุกครั้งที่ upsert สำเร็จ)
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  const attendanceByLambId = useMemo(() => {
    const map = new Map<
      string,
      {
        came_to_church: boolean;
        came_to_group_care: boolean;
        note: string | null;
      }
    >();
    (attendance ?? []).forEach((row) => {
      map.set(row.lamb_id, {
        came_to_church: row.came_to_church,
        came_to_group_care: row.came_to_group_care,
        note: row.note,
      });
    });
    return map;
  }, [attendance]);

  if (isMembersError || isAttendanceError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>โหลดข้อมูลเช็คชื่อไม่สำเร็จ</AlertTitle>
        <AlertDescription>ลองรีเฟรชหน้านี้อีกครั้ง</AlertDescription>
      </Alert>
    );
  }

  if (isMembersPending || isAttendancePending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        กลุ่มแคร์นี้ยังไม่มีสมาชิก
      </p>
    );
  }

  const handleToggle = (
    member: AttendanceMember,
    field: "came_to_church" | "came_to_group_care",
    checked: boolean,
  ) => {
    const existing = attendanceByLambId.get(member.id);
    upsertAttendance.mutate({
      lambId: member.id,
      weekStart,
      cameToChurch:
        field === "came_to_church"
          ? checked
          : (existing?.came_to_church ?? false),
      cameToGroupCare:
        field === "came_to_group_care"
          ? checked
          : (existing?.came_to_group_care ?? false),
      note: draftNotes[member.id] ?? existing?.note ?? null,
    });
  };

  const handleNoteBlur = (member: AttendanceMember) => {
    const existing = attendanceByLambId.get(member.id);
    const draft = draftNotes[member.id];
    if (draft === undefined || draft === (existing?.note ?? "")) return;

    upsertAttendance.mutate({
      lambId: member.id,
      weekStart,
      cameToChurch: existing?.came_to_church ?? false,
      cameToGroupCare: existing?.came_to_group_care ?? false,
      note: draft.trim() === "" ? null : draft,
    });
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>สมาชิก</TableHead>
            <TableHead className="text-center">มาโบสถ์</TableHead>
            <TableHead className="text-center">มากลุ่มแคร์</TableHead>
            <TableHead>หมายเหตุ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const existing = attendanceByLambId.get(member.id);
            const noteValue = draftNotes[member.id] ?? existing?.note ?? "";
            const displayName =
              member.nick_name || `${member.first_name} ${member.last_name}`;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  {/* ลิงก์ไปหน้าโปรไฟล์แกะ — pattern เดียวกับ
                  lamb-info-columns.tsx (เปิดหน้าเดียวกัน ไม่เปิดแท็บใหม่;
                  ดู grill-me 2026-08-13) */}
                  <Link
                    to="/lamb-info/$lambId"
                    params={{ lambId: member.id }}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile_picture ?? undefined} />
                      <AvatarFallback>
                        {(member.nick_name || member.first_name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{displayName}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={existing?.came_to_church ?? false}
                    onCheckedChange={(checked) =>
                      handleToggle(member, "came_to_church", checked === true)
                    }
                    aria-label={`${displayName} มาโบสถ์`}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={existing?.came_to_group_care ?? false}
                    onCheckedChange={(checked) =>
                      handleToggle(
                        member,
                        "came_to_group_care",
                        checked === true,
                      )
                    }
                    aria-label={`${displayName} มากลุ่มแคร์`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={noteValue}
                    placeholder="เช่น ลาป่วย, ติดธุระ"
                    onChange={(e) =>
                      setDraftNotes((prev) => ({
                        ...prev,
                        [member.id]: e.target.value,
                      }))
                    }
                    onBlur={() => handleNoteBlur(member)}
                    className="h-8"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
