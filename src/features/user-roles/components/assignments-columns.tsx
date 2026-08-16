import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table";
import { type AssignmentRow } from "../data/schema";
import { AssignmentsRowActions } from "./assignments-row-actions";

export const assignmentsColumns: ColumnDef<AssignmentRow>[] = [
  {
    id: "lambName",
    accessorFn: (row) =>
      row.lamb
        ? `${row.lamb.first_name} ${row.lamb.last_name}`.trim()
        : "(unknown lamb)",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lamb" />
    ),
    cell: ({ row }) => (
      <div className="ps-3 font-medium">
        {row.getValue("lambName")}
        {row.original.lamb?.nick_name ? (
          <span className="text-muted-foreground ms-1">
            ({row.original.lamb.nick_name})
          </span>
        ) : null}
      </div>
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
    id: "roleName",
    accessorFn: (row) => row.roleName ?? row.role,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => (
      <div>
        {row.getValue("roleName")}{" "}
        <span className="text-muted-foreground font-mono text-xs">
          ({row.original.role})
        </span>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {new Date(row.getValue("created_at")).toLocaleDateString()}
      </div>
    ),
  },
  {
    id: "actions",
    cell: AssignmentsRowActions,
  },
];
