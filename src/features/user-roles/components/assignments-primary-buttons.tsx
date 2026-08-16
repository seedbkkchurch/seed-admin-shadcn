import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssignments } from "./assignments-provider";

export function AssignmentsPrimaryButtons() {
  const { setOpen } = useAssignments();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Assignment</span> <Plus size={18} />
      </Button>
    </div>
  );
}
