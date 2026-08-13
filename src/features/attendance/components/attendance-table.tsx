import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, MessageSquareText } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  useAttendanceMembers,
  useAttendanceWeek,
  useUpsertAttendance,
} from "../data/queries";
import { type AttendanceMember } from "../data/schema";
import { AttendanceNoteDialog } from "./attendance-note-dialog";

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
  const isMobile = useIsMobile();

  // ค่า note ที่กำลังพิมพ์อยู่ก่อน blur (desktop) — เก็บแยกจาก query cache เพื่อไม่ให้ค่า
  // กระโดดกลับตอนพิมพ์ (query จะ refetch ทุกครั้งที่ upsert สำเร็จ)
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  // สมาชิกที่กำลังเปิด dialog เขียน note อยู่ (มือถือ) — null = ปิดอยู่ ดู grill-me
  // 2026-08-13 (attendance mobile layout): คอลัมน์ note ถูกซ่อนบนมือถือ เข้าถึงผ่านปุ่ม
  // ไอคอนท้ายแถว + dialog แทน inline input
  const [noteDialogMember, setNoteDialogMember] =
    useState<AttendanceMember | null>(null);

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

  // บันทึก note ตรงๆ (ไม่ผ่าน draftNotes) — ใช้ร่วมกันทั้ง desktop (handleNoteBlur) และ
  // มือถือ (AttendanceNoteDialog onSave)
  const saveNote = (member: AttendanceMember, noteValue: string) => {
    const existing = attendanceByLambId.get(member.id);
    upsertAttendance.mutate({
      lambId: member.id,
      weekStart,
      cameToChurch: existing?.came_to_church ?? false,
      cameToGroupCare: existing?.came_to_group_care ?? false,
      note: noteValue.trim() === "" ? null : noteValue,
    });
  };

  const handleNoteBlur = (member: AttendanceMember) => {
    const existing = attendanceByLambId.get(member.id);
    const draft = draftNotes[member.id];
    if (draft === undefined || draft === (existing?.note ?? "")) return;
    saveNote(member, draft);
  };

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className={cn(isMobile && "table-fixed")}>
        <TableHeader>
          <TableRow>
            <TableHead>สมาชิก</TableHead>
            <TableHead className={cn("text-center", isMobile && "w-16")}>
              {isMobile ? "มาโบส" : "มาโบสถ์"}
            </TableHead>
            <TableHead className={cn("text-center", isMobile && "w-16")}>
              {isMobile ? "มาแคร์" : "มากลุ่มแคร์"}
            </TableHead>
            <TableHead className={isMobile ? "w-10" : undefined}>
              {isMobile ? (
                <span className="sr-only">หมายเหตุ</span>
              ) : (
                "หมายเหตุ"
              )}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const existing = attendanceByLambId.get(member.id);
            const noteValue = draftNotes[member.id] ?? existing?.note ?? "";
            const displayName =
              member.nick_name || `${member.first_name} ${member.last_name}`;
            const hasNote = !!(existing?.note && existing.note.trim() !== "");

            return (
              <TableRow key={member.id}>
                <TableCell className={isMobile ? "max-w-0" : undefined}>
                  {/* ลิงก์ไปหน้าโปรไฟล์แกะ — pattern เดียวกับ
                  lamb-info-columns.tsx (เปิดหน้าเดียวกัน ไม่เปิดแท็บใหม่;
                  ดู grill-me 2026-08-13) */}
                  <Link
                    to="/lamb-info/$lambId"
                    params={{ lambId: member.id }}
                    className="flex min-w-0 items-center gap-2 hover:underline"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={member.profile_picture ?? undefined} />
                      <AvatarFallback>
                        {(member.nick_name || member.first_name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">
                      {displayName}
                    </span>
                  </Link>
                </TableCell>
                {/* ขยายพื้นที่แตะให้เต็ม cell — Checkbox เริ่มต้นมีแค่ 16x16px เล็กกว่า
                touch target มาตรฐาน (44x44px) กดพลาดง่ายบนมือถือ (ดู grill-me
                2026-08-13, attendance mobile layout) */}
                <TableCell
                  className="cursor-pointer p-2 text-center"
                  onClick={() =>
                    handleToggle(
                      member,
                      "came_to_church",
                      !(existing?.came_to_church ?? false),
                    )
                  }
                >
                  <Checkbox
                    checked={existing?.came_to_church ?? false}
                    onCheckedChange={(checked) =>
                      handleToggle(member, "came_to_church", checked === true)
                    }
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${displayName} มาโบสถ์`}
                  />
                </TableCell>
                <TableCell
                  className="cursor-pointer p-2 text-center"
                  onClick={() =>
                    handleToggle(
                      member,
                      "came_to_group_care",
                      !(existing?.came_to_group_care ?? false),
                    )
                  }
                >
                  <Checkbox
                    checked={existing?.came_to_group_care ?? false}
                    onCheckedChange={(checked) =>
                      handleToggle(
                        member,
                        "came_to_group_care",
                        checked === true,
                      )
                    }
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${displayName} มากลุ่มแคร์`}
                  />
                </TableCell>
                {isMobile ? (
                  <TableCell className="p-1 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setNoteDialogMember(member)}
                      aria-label={
                        hasNote
                          ? `แก้ไขหมายเหตุของ ${displayName}`
                          : `เพิ่มหมายเหตุของ ${displayName}`
                      }
                    >
                      <MessageSquareText
                        className={cn(
                          "size-4",
                          hasNote
                            ? "fill-primary/20 text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                    </Button>
                  </TableCell>
                ) : (
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
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {noteDialogMember && (
        <AttendanceNoteDialog
          open={!!noteDialogMember}
          onOpenChange={(open) => {
            if (!open) setNoteDialogMember(null);
          }}
          memberName={
            noteDialogMember.nick_name ||
            `${noteDialogMember.first_name} ${noteDialogMember.last_name}`
          }
          note={attendanceByLambId.get(noteDialogMember.id)?.note ?? ""}
          onSave={(note) => saveNote(noteDialogMember, note)}
          isSaving={upsertAttendance.isPending}
        />
      )}
    </div>
  );
}
