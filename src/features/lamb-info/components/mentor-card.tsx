import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { HandHeart, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type MentorRef } from "../data/schema";
import { useMentees } from "../data/queries";
import {
  useMentorOptions,
  useUpdateMentor,
} from "@/features/mentorship/data/queries";

// การ์ด "พี่เลี้ยง" บนหน้าโปรไฟล์ลูกแกะ — grill-me 2026-08-28. แสดงพี่เลี้ยง
// ของตัวเอง (read-only ให้ทุกคน) + รายชื่อลูกแกะที่ตัวเองดูแลอยู่ (ถ้ามี, ทุก
// role เห็นได้ — คนที่เป็นพี่เลี้ยงย่อมมี role cell_leader/team_leader ขึ้น
// ไปอยู่แล้วตามข้อจำกัดของ dropdown เลือกพี่เลี้ยง) ส่วนแก้ไข (Select เปลี่ยน
// พี่เลี้ยง) โชว์เฉพาะ canEdit=true (lamb:edit:mentor — team_leader/admin/
// super_admin, ดู mentorship/data/queries.ts) — แก้ inline ที่นี่ได้เลย ไม่
// ต้องไปหน้า /mentorship เสมอไป (อีกจุดคือหน้าตาราง /mentorship เอง)
function displayName(
  p: Pick<MentorRef, "nick_name" | "first_name" | "last_name">,
) {
  return (
    p.nick_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || "?"
  );
}

function MentorPersonRow({ person }: { person: MentorRef }) {
  return (
    <Link
      to="/lamb-info/$lambId"
      params={{ lambId: person.id }}
      className="flex items-center gap-3 rounded-md p-2 -mx-2 hover:bg-muted/50 transition-colors"
    >
      <Avatar className="size-9">
        <AvatarImage src={person.profile_picture ?? undefined} />
        <AvatarFallback>
          {(person.nick_name || person.first_name || "?")
            .charAt(0)
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-sm font-medium">{displayName(person)}</div>
    </Link>
  );
}

type MentorCardProps = {
  lambId: string;
  mentor: MentorRef | null | undefined;
  canEdit: boolean;
};

export function MentorCard({ lambId, mentor, canEdit }: MentorCardProps) {
  const { data: mentees, isPending: menteesPending } = useMentees(lambId);
  const { data: mentorOptions } = useMentorOptions();
  const updateMentor = useUpdateMentor();

  const handleChange = (value: string) => {
    const mentorId = value === "__none__" ? null : value;
    updateMentor.mutate(
      { lambId, mentorId },
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="size-4" /> พี่เลี้ยง
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            พี่เลี้ยงของฉัน
          </div>
          {canEdit ? (
            <Select
              value={mentor?.id ?? "__none__"}
              onValueChange={handleChange}
              disabled={updateMentor.isPending}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="เลือกพี่เลี้ยง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ไม่มีพี่เลี้ยง</SelectItem>
                {mentorOptions
                  ?.filter((m) => m.id !== lambId)
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {displayName(m)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          ) : mentor ? (
            <MentorPersonRow person={mentor} />
          ) : (
            <div className="text-sm text-muted-foreground italic">
              ยังไม่มีพี่เลี้ยง
            </div>
          )}
        </div>

        {(menteesPending || (mentees && mentees.length > 0)) && (
          <div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Users className="size-3" /> ลูกแกะในความดูแล
            </div>
            {menteesPending ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <div className="space-y-1">
                {mentees!.map((m) => (
                  <MentorPersonRow key={m.id} person={m} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
