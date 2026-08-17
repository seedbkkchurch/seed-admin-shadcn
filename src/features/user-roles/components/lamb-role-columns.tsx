import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table";
import { type LambRoleRow, type RoleRow } from "../data/schema";
import { LambRoleCell } from "./lamb-role-cell";

export function makeLambRoleColumns(
  roles: RoleRow[],
): ColumnDef<LambRoleRow>[] {
  return [
    {
      id: "lambName",
      accessorFn: (row) => `${row.first_name} ${row.last_name}`.trim(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lamb" />
      ),
      cell: ({ row }) => (
        <div className="ps-3 font-medium">
          {row.getValue("lambName")}
          {row.original.nick_name ? (
            <span className="text-muted-foreground ms-1">
              ({row.original.nick_name})
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
      id: "role",
      accessorFn: (row) =>
        roles.find((r) => r.code === row.role)?.name_th ?? row.role,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <LambRoleCell lamb={row.original} roles={roles} />,
      enableSorting: false,
    },
  ];
}
