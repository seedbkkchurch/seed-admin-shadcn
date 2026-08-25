import { useState } from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";
import { type Row } from "@tanstack/react-table";
import { Archive, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchiveNews } from "../data/queries";
import { type NewsRowWithRelations } from "../data/schema";

type NewsTableRowActionsProps = {
  row: Row<NewsRowWithRelations>;
};

// Row-level actions — "แก้ไข" เปิดฟอร์มแก้ไข, "เก็บถาวร" คือ soft delete
// (status='archived' — ไม่มีการลบจริงตกลงใน grill-me 2026-08-25) ซ่อนปุ่ม
// เก็บถาวรถ้าเก็บถาวรอยู่แล้ว
export function NewsTableRowActions({ row }: NewsTableRowActionsProps) {
  const navigate = useNavigate();
  const archiveNews = useArchiveNews();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isArchived = row.original.status === "archived";

  const handleArchive = async () => {
    try {
      await archiveNews.mutateAsync([row.original.id]);
      toast.success("เก็บถาวรข่าวแล้ว");
      setConfirmOpen(false);
    } catch (error) {
      toast.error("เก็บถาวรไม่สำเร็จ", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">เปิดเมนู</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: "/news/$newsId/edit",
                params: { newsId: row.original.id },
              })
            }
          >
            แก้ไข
            <DropdownMenuShortcut>
              <Pencil size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {!isArchived && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              เก็บถาวร
              <DropdownMenuShortcut>
                <Archive size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        handleConfirm={() => void handleArchive()}
        disabled={archiveNews.isPending}
        title="เก็บถาวรข่าวนี้?"
        desc={`"${row.original.title}" จะไม่แสดงในหน้าข่าวสาธารณะและหน้ารายการอีก — กู้คืนได้ภายหลังโดยเปลี่ยนสถานะกลับที่หน้าแก้ไข`}
        confirmText="เก็บถาวร"
        cancelBtnText="ยกเลิก"
        destructive
      />
    </>
  );
}
