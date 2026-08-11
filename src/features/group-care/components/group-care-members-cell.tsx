import { type CellContext } from "@tanstack/react-table";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GroupCareRowWithMembers } from "../data/schema";
import { useGroupCare } from "./group-care-provider";

export function GroupCareMembersCell({
  row,
}: CellContext<GroupCareRowWithMembers, unknown>) {
  const { setOpen, setCurrentRow } = useGroupCare();
  const count = row.original.members.length;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
      onClick={() => {
        setCurrentRow(row.original);
        setOpen("members");
      }}
    >
      <Users className="size-4" />
      {count}
    </Button>
  );
}
