import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download, Pencil, Trash2 } from 'lucide-react'
import type { TableColumn } from '../types'
import { EmptyState } from './EmptyState'
import { exportToCSV } from '../csv-utils'

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string | null
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  exportFilename?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionHref?: string
  filterElement?: React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  data, columns, loading = false, error = null, searchable = true,
  searchPlaceholder = 'Search…', pageSize = 10, onEdit, onDelete,
  exportFilename, emptyTitle = 'No data found',
  emptyDescription = 'There are no records to display yet.',
  emptyActionLabel, emptyActionHref, filterElement,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      }),
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleExport() {
    if (!exportFilename) return
    exportToCSV(data as Record<string, unknown>[], columns.map(c => ({ key: c.key, label: c.label })), exportFilename)
  }

  const hasActions = !!onEdit || !!onDelete

  function alignClass(align?: string) {
    if (align === 'right') return 'portal-text-right'
    if (align === 'center') return 'portal-text-center'
    return ''
  }

  if (loading) {
    return (
      <div className="portal-table-wrap portal-form-stack portal-p-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="portal-skeleton portal-skeleton-row" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-alert portal-alert-error">
        <div><p className="portal-csv-format-title">Error loading data</p><p>{error}</p></div>
      </div>
    )
  }

  return (
    <div className="portal-table-wrap">
      {/* Toolbar */}
      <div className="portal-toolbar">
        {searchable && (
          <div className="portal-input-icon-wrap portal-toolbar-search">
            <Search size={16} className="portal-input-icon" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder={searchPlaceholder}
              className="portal-input"
            />
          </div>
        )}
        {filterElement}
        <div className="portal-toolbar-actions">
          <span className="portal-toolbar-count">{sorted.length} record{sorted.length !== 1 ? 's' : ''}</span>
          {exportFilename && (
            <button onClick={handleExport} className="portal-btn portal-btn-secondary portal-btn-sm">
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table or empty */}
      {sorted.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />
      ) : (
        <div className="portal-overflow-x">
          <table className="portal-table">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                    className={`${col.sortable !== false ? 'sortable' : ''} ${alignClass(col.align)}`}
                  >
                    <span className="portal-sort-indicator">
                      {col.label}
                      {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </span>
                  </th>
                ))}
                {hasActions && <th className="portal-col-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={String(row.id ?? idx)}>
                  {columns.map(col => (
                    <td key={col.key} className={alignClass(col.align)}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] != null ? String(row[col.key]) : '—')}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="portal-text-right">
                      <div className="portal-action-row">
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="portal-table-action" aria-label="Edit">
                            <Pencil size={15} />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="portal-table-action portal-table-action-delete" aria-label="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="portal-pagination">
          <span>Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}</span>
          <div className="portal-pagination-btns">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0} className="portal-page-btn" aria-label="Previous page"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`portal-page-btn ${i === safePage ? 'active' : ''}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1} className="portal-page-btn" aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
