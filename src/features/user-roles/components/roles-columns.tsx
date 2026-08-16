import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table";
import { type RoleRow } from "../data/schema";
import { RolesRowActions } from "./roles-row-actions";

export const rolesColumns: ColumnDef<RoleRow>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <div className="ps-3 font-mono font-medium">{row.getValue("code")}</div>
    ),
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]",
        "inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none",
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: "name_th",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name (TH)" />
    ),
    cell: ({ row }) => <div>{row.getValue("name_th")}</div>,
    enableSorting: false,
  },
  {
    accessorKey: "sort_order",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sort Order" />
    ),
    cell: ({ row }) => <div>{row.getValue("sort_order")}</div>,
  },
  {
    id: "actions",
    cell: RolesRowActions,
  },
];
