import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table";
import {
  NEWS_STATUS_LABELS,
  newsStatusFilterOptions,
  type NewsRowWithRelations,
} from "../data/schema";
import { NewsTableRowActions } from "./news-table-row-actions";

export { newsStatusFilterOptions };

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "published") return "default";
  if (status === "draft") return "secondary";
  return "outline";
}

export const newsTableColumns: ColumnDef<NewsRowWithRelations>[] = [
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
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="หัวข้อ" />
    ),
    meta: { className: "max-w-0 w-1/3" },
    cell: ({ row }) => (
      <Link
        to="/news/$newsId/edit"
        params={{ newsId: row.original.id }}
        className="truncate font-medium hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    id: "author_name",
    accessorFn: (row) =>
      row.author
        ? (row.author.nick_name ?? row.author.first_name)
        : "ไม่ทราบชื่อ",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ผู้เขียน" />
    ),
  },
  {
    id: "category",
    accessorFn: (row) => row.news_category?.name_th ?? "-",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="หมวดหมู่" />
    ),
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value === "-" ? (
        <span className="text-muted-foreground text-sm">-</span>
      ) : (
        <Badge variant="outline">{value}</Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="สถานะ" />
    ),
    cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <Badge variant={statusBadgeVariant(status)}>
          {NEWS_STATUS_LABELS[status] ?? status}
        </Badge>
      );
    },
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
      <DataTableColumnHeader column={column} title="สร้างเมื่อ" />
    ),
    cell: ({ row }) =>
      format(parseISO(row.original.created_at), "d MMM yyyy HH:mm"),
  },
  {
    id: "actions",
    cell: ({ row }) => <NewsTableRowActions row={row} />,
  },
];
