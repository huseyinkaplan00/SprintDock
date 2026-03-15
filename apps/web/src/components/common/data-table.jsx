import React from 'react'
import { DataTable as UiDataTable } from '../ui/table.jsx'
import { Input } from '../ui/input.jsx'
import { Button } from '../ui/button.jsx'
import { Dropdown, DropdownItem } from '../ui/dropdown.jsx'

function toTanstackColumns(columns) {
  return columns.map((column) => ({
    id: column.key,
    accessorFn: (row) => row[column.key],
    header: column.label,
    cell: (ctx) => {
      const row = ctx.row.original
      return column.render ? column.render(row) : row[column.key]
    },
    enableSorting: column.sortable !== false,
  }))
}

export default function DataTable({ columns, data }) {
  const tanstackColumns = React.useMemo(() => toTanstackColumns(columns), [columns])

  return (
    <UiDataTable
      columns={tanstackColumns}
      data={data}
      renderToolbar={({ table, globalFilter, setGlobalFilter }) => (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Input
            className="max-w-xs"
            placeholder="Ara..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
          />
          <Dropdown
            trigger={
              <Button variant="outline" size="sm">
                Sutunlar
              </Button>
            }
          >
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownItem
                  key={column.id}
                  onSelect={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  {column.getIsVisible() ? 'Gizle' : 'Goster'} {column.id}
                </DropdownItem>
              ))}
          </Dropdown>
        </div>
      )}
    />
  )
}
