import { useMemo, useState } from "react";
import {
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination, DataTableToolbar } from "@/components/data-table";
import {
  DEVOTION_CONTENT_TYPE_LABELS,
  type DevotionContentType,
  type LambDevotionRow,
} from "../data/devotion-schema";
import { DevotionTableBulkActions } from "./devotion-table-bulk-actions";
import { devotionVisibilityOptions } from "./devotion-table-columns";
import { lambDevotionTableColumns as columns } from "./lamb-devotion-table-columns";

type ContentTypeTab = "all" | DevotionContentType;

type LambDevotionTableProps = {
  data: LambDevotionRow[];
};

// Full sort/filter/pagination/bulk-delete data table scoped to ONE lamb's
// เฝ้าเดี่ยว history — opened via "ดูทั้งหมด" on the profile page's
// devotion-section.tsx. Shows image thumbnails (see
// lamb-devotion-table-columns.tsx), unlike the all-lambs admin test table
// (devotion-table.tsx). Per grill-me follow-up (2026-08-11). Sort/filter/
// pagination state is local (not URL-synced) — this is a secondary detail
// view reached from a profile, not the primary admin table.
export function LambDevotionTable({ data }: LambDevotionTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // แท็บ ทั้งหมด / เฝ้าเดี่ยว / คำเทศนา แทน dropdown "ประเภท" เดิมในแถบ
  // เครื่องมือ (grill-me 2026-09-23 — เห็นชัดกว่า โดยเฉพาะบนมือถือ) ยังกรอง
  // ผ่าน column filter "content_type" ตัวเดิม แท็บเป็นแค่ UI ที่คุมค่านั้น
  const contentTypeFilter = columnFilters.find((f) => f.id === "content_type")
    ?.value as string[] | undefined;
  const activeTab: ContentTypeTab =
    contentTypeFilter?.length === 1
      ? (contentTypeFilter[0] as DevotionContentType)
      : "all";
  const counts = useMemo(
    () => ({
      all: data.length,
      devotion: data.filter((d) => d.content_type === "devotion").length,
      sermon: data.filter((d) => d.content_type === "sermon").length,
    }),
    [data],
  );
  const handleTabChange = (value: string) => {
    const tab = value as ContentTypeTab;
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== "content_type"),
      ...(tab === "all" ? [] : [{ id: "content_type", value: [tab] }]),
    ]);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, _columnId, filterValue) => {
      const title = String(row.getValue("title")).toLowerCase();
      const searchValue = String(filterValue).toLowerCase();
      return title.includes(searchValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        "flex flex-1 flex-col gap-4",
      )}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {(["all", "devotion", "sermon"] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tab === "all" ? "ทั้งหมด" : DEVOTION_CONTENT_TYPE_LABELS[tab]}
              <span className="text-muted-foreground ms-1 text-xs">
                ({counts[tab]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <DataTableToolbar
        table={table}
        searchPlaceholder="ค้นหาหัวข้อ..."
        filters={[
          {
            columnId: "is_public",
            title: "สถานะ",
            options: devotionVisibilityOptions,
          },
        ]}
      />
      {/* overflow-x-auto (was overflow-hidden) so the 7-column table can be
      swiped horizontally on narrow screens instead of clipping cell text —
      grill-me 2026-08-30 ("ข้อความมันล้นตาราง") */}
      <div className="overflow-x-auto rounded-md border">
        {/* min-w-xl เฉพาะจอ sm ขึ้นไป — มือถือซ่อนคอลัมน์รองแล้ว (ดู
        lamb-devotion-table-columns.tsx) ตารางจึงพอดีจอโดยไม่ต้องเลื่อน */}
        <Table className="sm:min-w-xl">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  ยังไม่มีข้อมูล
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
      <DevotionTableBulkActions table={table} />
    </div>
  );
}
