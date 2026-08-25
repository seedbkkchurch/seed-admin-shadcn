import { useState } from "react";
import { type Table } from "@tanstack/react-table";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTableBulkActions as BulkActionsToolbar } from "@/components/data-table";
import { useArchiveNews } from "../data/queries";
import { type NewsRowWithRelations } from "../data/schema";

type NewsTableBulkActionsProps = {
  table: Table<NewsRowWithRelations>;
};

// Bulk "เก็บถาวร" (soft delete) — เหมือน DevotionTableBulkActions แต่
// archive แทน delete จริง (ตกลงใน grill-me 2026-08-25 ไม่มี hard delete
// ให้ news เลย)
export function NewsTableBulkActions({ table }: NewsTableBulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const archiveNews = useArchiveNews();
  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleArchive = async () => {
    try {
      await archiveNews.mutateAsync(selectedRows.map((r) => r.original.id));
      toast.success(`เก็บถาวร ${selectedRows.length} รายการแล้ว`);
      table.resetRowSelection();
      setShowConfirm(false);
    } catch (error) {
      toast.error("เก็บถาวรไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <BulkActionsToolbar table={table} entityName="ข่าว">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setShowConfirm(true)}
              className="size-8"
              aria-label="เก็บถาวรรายการที่เลือก"
              title="เก็บถาวรรายการที่เลือก"
            >
              <Archive />
              <span className="sr-only">เก็บถาวรรายการที่เลือก</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>เก็บถาวรรายการที่เลือก</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        handleConfirm={() => void handleArchive()}
        disabled={archiveNews.isPending}
        title={`เก็บถาวร ${selectedRows.length} รายการ?`}
        desc="ข่าวที่เลือกจะไม่แสดงในหน้าข่าวสาธารณะและหน้ารายการอีก — กู้คืนได้ภายหลัง"
        confirmText="เก็บถาวร"
        cancelBtnText="ยกเลิก"
        destructive
      />
    </>
  );
}
