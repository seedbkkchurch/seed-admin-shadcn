import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";
import { type Row } from "@tanstack/react-table";
import { useState } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type LambDevotionRow } from "../data/devotion-schema";
import { DevotionChangeDateDialog } from "./devotion-change-date-dialog";

type DevotionTableRowActionsProps = {
  row: Row<LambDevotionRow>;
};

// Row-level actions for the admin test table (devotion-table.tsx) — just
// "แก้ไข" (edit title/content/status) for now, added per grill-me
// follow-up (2026-08-11). เพิ่ม "เปลี่ยนวันที่" (grill-me 2026-10-07).
export function DevotionTableRowActions({ row }: DevotionTableRowActionsProps) {
  const navigate = useNavigate();
  const [dateOpen, setDateOpen] = useState(false);

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
                to: "/lamb-info/devotion/$devotionId/edit",
                params: { devotionId: row.original.id },
              })
            }
          >
            แก้ไข
            <DropdownMenuShortcut>
              <Pencil size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDateOpen(true)}>
            เปลี่ยนวันที่
            <DropdownMenuShortcut>
              <CalendarDays size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {dateOpen && (
        <DevotionChangeDateDialog
          entry={row.original}
          open={dateOpen}
          onOpenChange={setDateOpen}
        />
      )}
    </>
  );
}
