import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLambInfo } from "./lamb-info-provider";

export function LambInfoPrimaryButtons() {
  const { setOpen } = useLambInfo();
  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen("add")}>
        <span>Add Lamb</span> <UserPlus size={18} />
      </Button>
    </div>
  );
}
