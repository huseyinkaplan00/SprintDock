import React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Button } from '../button.jsx'
import { cn } from '../../lib/cn.js'

export function DataTable({
  data,
  columns,
  initialPageSize = 10,
  initialColumnVisibility,
  emptyText = 'No records found.',
  loading = false,
  loadingRows = 6,
  renderToolbar,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  onRowClick,
}) {
  const [sorting, setSorting] = React.useState([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] = React.useState(
    () => initialColumnVisibility || {}
  )
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const resolvedRowSelection = rowSelection ?? internalRowSelection

  const handleRowSelectionChange = React.useCallback(
    (updater) => {
      const prev = resolvedRowSelection
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (rowSelection === undefined) setInternalRowSelection(next)
      if (onRowSelectionChange) onRowSelectionChange(next)
    },
    [onRowSelectionChange, resolvedRowSelection, rowSelection]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      pagination,
      rowSelection: resolvedRowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
  })

  const rowCount = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-3">
      {renderToolbar ? renderToolbar({ table, globalFilter, setGlobalFilter }) : null}
      <div className="overflow-x-auto rounded-xl border border-border-light bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/70 dark:bg-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="inline-flex cursor-pointer select-none items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: '↑',
                          desc: '↓',
                        }[header.column.getIsSorted()] || ''}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border-light dark:divide-border-dark">
            {loading ? (
              Array.from({ length: loadingRows }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  {table.getVisibleLeafColumns().map((column) => (
                    <td key={`${column.id}-loading-${index}`} className="px-4 py-3 align-middle">
                      <div className="h-4 w-full max-w-[180px] animate-pulse rounded bg-slate-200/80 dark:bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={(event) => {
                    if (!onRowClick) return
                    const target = event.target
                    const interactive =
                      target instanceof Element
                        ? target.closest(
                            'a,button,input,textarea,select,label,[role="button"],[role="menuitem"],[data-row-click-stop="true"]'
                          )
                        : null
                    if (interactive) return
                    onRowClick(row.original, row, event)
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  colSpan={table.getAllColumns().length}
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">Toplam {rowCount} kayit</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Onceki
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
}
