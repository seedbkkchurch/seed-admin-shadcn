import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroupCare } from "./group-care-provider";

export function GroupCarePrimaryButtons() {
  const { setOpen } = useGroupCare();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Group</span> <Plus size={18} />
      </Button>
    </div>
  );
}
