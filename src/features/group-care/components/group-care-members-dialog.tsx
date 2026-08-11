import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type GroupCareRowWithMembers } from "../data/schema";

type GroupCareMembersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: GroupCareRowWithMembers;
};

export function GroupCareMembersDialog({
  open,
  onOpenChange,
  currentRow,
}: GroupCareMembersDialogProps) {
  const { members } = currentRow;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentRow.name}</DialogTitle>
          <DialogDescription>
            {members.length === 1 ? "1 member" : `${members.length} members`}
          </DialogDescription>
        </DialogHeader>

        {members.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No members yet.
          </p>
        ) : (
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {members.map((member) => {
              const displayName =
                member.nick_name ||
                [member.first_name, member.last_name].filter(Boolean).join(" ");
              const initial = (member.nick_name || member.first_name || "?")
                .charAt(0)
                .toUpperCase();
              return (
                <Link
                  key={member.id}
                  to="/lamb-info/$lambId"
                  params={{ lambId: member.id }}
                  onClick={() => onOpenChange(false)}
                  className="hover:bg-muted flex items-center gap-2 rounded-md p-2 text-sm"
                >
                  <Avatar className="size-8">
                    {member.profile_picture && (
                      <AvatarImage src={member.profile_picture} alt="" />
                    )}
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                  <span>{displayName || "-"}</span>
                </Link>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
