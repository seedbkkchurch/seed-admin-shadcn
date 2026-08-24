import { type ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { getTagColorClass, splitTags } from "@/lib/tag-color";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table";
import { LongText } from "@/components/long-text";
import { type LambInfoRow } from "../data/schema";
import { DataTableRowActions } from "./data-table-row-actions";

export const lambInfoColumns: ColumnDef<LambInfoRow>[] = [
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
    meta: {
      className: cn("inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky"),
    },
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
    accessorKey: "nick_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nickname" />
    ),
    cell: ({ row }) => {
      const { profile_picture, nick_name, first_name } = row.original;
      const initial = (nick_name || first_name || "?").charAt(0).toUpperCase();
      return (
        <Link
          to="/lamb-info/$lambId"
          params={{ lambId: row.original.id }}
          className="flex items-center gap-2 ps-3 hover:underline"
        >
          <Avatar className="rounded-md">
            {profile_picture && <AvatarImage src={profile_picture} alt="" />}
            <AvatarFallback className="rounded-md">{initial}</AvatarFallback>
          </Avatar>
          <LongText className="max-w-36">{nick_name || "-"}</LongText>
        </Link>
      );
    },
    meta: {
      className: cn(
        "drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]",
        "inset-s-6 ps-0.5 max-md:sticky @4xl/content:table-cell @4xl/content:drop-shadow-none",
      ),
    },
    enableHiding: false,
  },
  {
    id: "fullName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const { first_name, last_name } = row.original;
      const fullName = [first_name, last_name].filter(Boolean).join(" ");
      return (
        <LongText className="max-w-48">
          <Link
            to="/lamb-info/$lambId"
            params={{ lambId: row.original.id }}
            className="hover:underline"
          >
            {fullName}
          </Link>
        </LongText>
      );
    },
    meta: { className: "w-48" },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
    enableSorting: false,
  },
  {
    // A lamb belongs to at most one care group, but accessorFn still
    // returns a singleton array (rather than the bare id) so the faceted
    // filter can reuse the same "arrIncludesSome" filterFn as the tags
    // column above (see lamb-info-table.tsx) instead of a bespoke
    // scalar-equality filterFn. Display is untouched — the cell still
    // renders straight from row.original.group_care_info.
    id: "group",
    accessorFn: (row) => (row.group_care_info ? [row.group_care_info.id] : []),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Group" />
    ),
    cell: ({ row }) => {
      const groupName = row.original.group_care_info?.name;
      return groupName ? (
        <Badge variant="outline" className={getTagColorClass(groupName)}>
          {groupName}
        </Badge>
      ) : (
        <div>-</div>
      );
    },
    filterFn: "arrIncludesSome",
    enableSorting: false,
  },
  {
    // Was is_leader_group_care — now derived from lamb_info.role (see
    // rbac_lamb_role_redesign project memory, grill-me 2026-08-17).
    id: "leader",
    header: "Leader",
    cell: ({ row }) => {
      const { role } = row.original;
      if (role !== "cell_leader" && role !== "team_leader") return <div>-</div>;
      return (
        <Badge
          variant="outline"
          className="bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200"
        >
          {role === "team_leader" ? "ทีมผู้รับใช้หลัก" : "หัวหน้าแคร์"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      return (
        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            status
              ? "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"
              : "bg-neutral-300/40 border-neutral-300",
          )}
        >
          {status ? "Active" : "Inactive"}
        </Badge>
      );
    },
    // Sorting on this column is always pinned first by the table (see
    // lamb-info-table.tsx) rather than user-toggled, so no sort-toggle
    // header UI is rendered here.
    enableSorting: true,
  },
  {
    // `lamb_info.tags` is one comma-separated string per row (e.g. "Pastor,
    // Leader team"), not an array column. The accessorFn below splits it
    // so the faceted filter can offer/match individual tags (see
    // lamb-info-table.tsx) — filtering is per-tag, OR'd across whatever's
    // selected. Display is untouched: still renders the raw, un-split
    // string as a single badge (row.original.tags), by design — only the
    // filter behavior changes, not the table's look.
    id: "tags",
    accessorFn: (row) => splitTags(row.tags),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tags" />
    ),
    cell: ({ row }) => {
      const tags = row.original.tags;
      return tags ? (
        <Badge variant="outline" className={getTagColorClass(tags)}>
          {tags}
        </Badge>
      ) : (
        <div>-</div>
      );
    },
    filterFn: "arrIncludesSome",
    enableSorting: false,
  },
  {
    id: "actions",
    cell: DataTableRowActions,
  },
];
