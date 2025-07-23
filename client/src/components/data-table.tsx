import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  FilterFn,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"


interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
}

import { ArrowUpDown } from "lucide-react"
import { useState } from "react";
import { Task } from "@/state/api";

export const taskColumns: ColumnDef<Task>[] = [

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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>)
    },
    cell: ({ row }) => <div className="truncate max-w-[200px]">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>)
    },
    cell: ({ row }) => <div>{row.getValue("status")}</div>,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>)
    },
    cell: ({ row }) => <div>{row.getValue("priority")}</div>,
  },
  {
    accessorKey: "dueDate",
 header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>)
    },
  cell: ({ row }) => {
    const raw = row.getValue("dueDate") as string | number | Date | undefined;
    const formatted = raw ? new Date(raw).toLocaleDateString() : "-";
    return <div>{formatted}</div>;
  },
  },
];

export function DataTable<TData>({ columns, data }: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({})
 
  const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
});


  const table = useReactTable({
  data,
  columns,
  state: {
    sorting,
    globalFilter,
    rowSelection,
    pagination,
  },
  onSortingChange: setSorting,
  onGlobalFilterChange: setGlobalFilter,
  onRowSelectionChange: setRowSelection,
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});

return (
  <div className="w-full">
    {/* Top Bar: Search + Selection Count */}
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-2">
      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search..."
        className="w-full sm:w-auto border border-gray-300 dark:border-gray-700 rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
      />
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} selected
      </div>
    </div>

    {/* Table */}
    <div className="overflow-auto rounded-md border border-gray-200 dark:border-gray-700 mt-2">
      <Table className="min-w-full bg-white dark:bg-gray-900">
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center justify-between">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" && <span>↑</span>}
                    {header.column.getIsSorted() === "desc" && <span>↓</span>}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition p-3"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-gray-500 dark:text-gray-400 "
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>

    {/* Pagination Controls */}
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Page {table.getState().pagination.pageIndex + 1} of{" "}
        {table.getPageCount()}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          First
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          Next
        </button>
        <button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  </div>
);}
