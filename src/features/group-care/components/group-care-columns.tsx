import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/data-table";
import { LongText } from "@/components/long-text";
import { type GroupCareRowWithMembers } from "../data/schema";
import { DataTableRowActions } from "./data-table-row-actions";
import { GroupCareMembersCell } from "./group-care-members-cell";

export const groupCareColumns: ColumnDef<GroupCareRowWithMembers>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-48 ps-3">{row.getValue("name")}</LongText>
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
    accessorKey: "address",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-64">{row.getValue("address") || "-"}</LongText>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "day",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Meeting Day" />
    ),
    cell: ({ row }) => <div>{row.getValue("day") || "-"}</div>,
    enableSorting: false,
  },
  {
    id: "members",
    accessorFn: (row) => row.members.length,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Members" />
    ),
    cell: GroupCareMembersCell,
  },
  {
    id: "leader",
    // Names of every member with role IN (cell_leader, team_leader),
    // joined for display; sortable via the same joined string (see
    // grill-me 2026-08-12, `group_care_leader` project memory — role
    // source updated 2026-08-17, see rbac_lamb_role_redesign).
    accessorFn: (row) =>
      row.leaders
        .map((leader) => leader.nick_name || leader.first_name)
        .join(", "),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Leader" />
    ),
    cell: ({ row }) => (
      <LongText className="max-w-48">
        {row.getValue("leader") || "-"}
      </LongText>
    ),
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
