import { useState } from "react";
import { type Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTableBulkActions as BulkActionsToolbar } from "@/components/data-table";
import { type LambDevotionRow } from "../data/devotion-schema";
import { DevotionTableMultiDeleteDialog } from "./devotion-table-multi-delete-dialog";

type DevotionTableBulkActionsProps = {
  table: Table<LambDevotionRow>;
};

export function DevotionTableBulkActions({
  table,
}: DevotionTableBulkActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <BulkActionsToolbar table={table} entityName="เฝ้าเดี่ยว">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowDeleteConfirm(true)}
              className="size-8"
              aria-label="ลบรายการที่เลือก"
              title="ลบรายการที่เลือก"
            >
              <Trash2 />
              <span className="sr-only">ลบรายการที่เลือก</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ลบรายการที่เลือก</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <DevotionTableMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  );
}
