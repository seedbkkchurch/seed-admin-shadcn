import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table";
import { type LambDevotionRow } from "../data/devotion-schema";
import { makeDevotionContentTypeColumn } from "./devotion-table-columns";
import { DevotionTableRowActions } from "./devotion-table-row-actions";

// Column set for the per-lamb full-history table (lamb-devotion-table.tsx)
// — same shape as devotionTableColumns (devotion-table-columns.tsx) minus
// the "ลูกแกะ" column (redundant, the lamb is already known from the page)
// plus a real image thumbnail in place of the admin table's icon+count.
// Per grill-me follow-up (2026-08-11).
//
// มือถือ (< 640px) ซ่อนคอลัมน์ รูป / ประเภท / ส่งเมื่อ ด้วย meta.className
// "hidden sm:table-cell" เหลือ ☐ วันที่ หัวข้อ สถานะ ⋮ ให้พอดีจอ ไม่ต้องเลื่อน
// ซ้ายขวา และหัวข้อตัดขึ้นบรรทัดใหม่ได้สูงสุด 2 บรรทัด แทน truncate บรรทัดเดียว
// (grill-me 2026-09-23 "ข้อความในตารางมันล้น เวลาอยู่ในเวอร์ชันมือถือ")
const HIDE_ON_MOBILE = "hidden sm:table-cell";

export const lambDevotionTableColumns: ColumnDef<LambDevotionRow>[] = [
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
    accessorKey: "devotion_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="วันที่" />
    ),
    meta: { className: "whitespace-nowrap" },
    cell: ({ row }) =>
      format(parseISO(row.original.devotion_date), "d MMM yyyy"),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="หัวข้อ" />
    ),
    // มือถือ: ให้คอลัมน์หัวข้อกินที่ที่เหลือและตัดบรรทัดได้, จอใหญ่: คง
    // max-w-0 w-1/3 + truncate แบบเดิม
    meta: { className: "w-full whitespace-normal sm:max-w-0 sm:w-1/3" },
    cell: ({ row }) => (
      <Link
        to="/lamb-info/devotion/$devotionId"
        params={{ devotionId: row.original.id }}
        className="line-clamp-2 font-medium break-words hover:underline sm:block sm:truncate"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "images",
    accessorFn: (row) => row.image_urls?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="รูป" />
    ),
    cell: ({ row }) => {
      const urls = row.original.image_urls;
      if (!urls || urls.length === 0) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }
      return (
        <div className="relative inline-block">
          <img
            src={urls[0]}
            alt={row.original.title}
            className="size-10 rounded-md border object-cover"
          />
          {urls.length > 1 && (
            <span className="bg-foreground text-background absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[9px] font-medium">
              +{urls.length - 1}
            </span>
          )}
        </div>
      );
    },
    meta: { className: HIDE_ON_MOBILE },
    enableSorting: false,
  },
  { ...makeDevotionContentTypeColumn(), meta: { className: HIDE_ON_MOBILE } },
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
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ส่งเมื่อ" />
    ),
    meta: { className: `${HIDE_ON_MOBILE} whitespace-nowrap` },
    cell: ({ row }) =>
      format(parseISO(row.original.created_at), "d MMM yyyy HH:mm"),
  },
  {
    id: "actions",
    cell: ({ row }) => <DevotionTableRowActions row={row} />,
  },
];
