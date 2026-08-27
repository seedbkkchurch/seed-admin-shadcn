import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table";
import {
  DEVOTION_CONTENT_TYPE_LABELS,
  devotionContentTypeOptions,
  lambDisplayName,
  type LambDevotionRow,
} from "../data/devotion-schema";
import { DevotionTableRowActions } from "./devotion-table-row-actions";

export const devotionVisibilityOptions = [
  { label: "สาธารณะ", value: "public" },
  { label: "ส่วนตัว", value: "private" },
];

// ตัวเลือกตัวกรอง "ประเภท" (เฝ้าเดี่ยว/คำเทศนา) — ใช้ร่วมกันทั้งตาราง
// admin (devotion-table.tsx) และตารางรายลูกแกะ (lamb-devotion-table.tsx)
// เพิ่มโดย grill-me 2026-08-26
export const devotionContentTypeFilterOptions = devotionContentTypeOptions;

// คอลัมน์ badge + filter ประเภทเนื้อหา — ใช้ร่วมกันทั้ง devotionTableColumns
// (ด้านล่าง) และ lambDevotionTableColumns (lamb-devotion-table-columns.tsx)
// เป็นฟังก์ชันสร้าง ColumnDef แทนที่จะ export ตัว object ตรงๆ เพื่อให้ type
// ตรงกับ ColumnDef<LambDevotionRow> เต็มรูปแบบ (ไม่ใช้ any/never hack)
export function makeDevotionContentTypeColumn(): ColumnDef<LambDevotionRow> {
  return {
    accessorKey: "content_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ประเภท" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary">
        {DEVOTION_CONTENT_TYPE_LABELS[row.original.content_type]}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  };
}

export const devotionTableColumns: ColumnDef<LambDevotionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "lamb_name",
    accessorFn: (row) =>
      row.lamb_info ? lambDisplayName(row.lamb_info) : "ไม่ทราบชื่อ",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ลูกแกะ" />
    ),
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "devotion_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="วันที่" />
    ),
    cell: ({ row }) =>
      format(parseISO(row.original.devotion_date), "d MMM yyyy"),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="หัวข้อ" />
    ),
    meta: { className: "max-w-0 w-1/3" },
    cell: ({ row }) => (
      <Link
        to="/lamb-info/devotion/$devotionId"
        params={{ devotionId: row.original.id }}
        className="truncate font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  makeDevotionContentTypeColumn(),
  {
    id: "is_public",
    accessorFn: (row) => (row.is_public ? "public" : "private"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="สถานะ" />
    ),
    cell: ({ getValue }) => (
      <Badge variant={getValue<string>() === "public" ? "default" : "outline"}>
        {getValue<string>() === "public" ? "สาธารณะ" : "ส่วนตัว"}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
  },
  {
    id: "image_count",
    accessorFn: (row) => row.image_urls?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="รูป" />
    ),
    cell: ({ getValue }) => {
      const count = getValue<number>();
      return count > 0 ? (
        <span className="flex items-center gap-1 text-sm">
          <ImageIcon className="size-3.5" /> {count}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">-</span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ส่งเมื่อ" />
    ),
    cell: ({ row }) =>
      format(parseISO(row.original.created_at), "d MMM yyyy HH:mm"),
  },
  {
    id: "actions",
    cell: ({ row }) => <DevotionTableRowActions row={row} />,
  },
];
