"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Filter, ChevronLeft, ChevronRight, Loader2, Download, Eye, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  title: string
  columns: Column<T>[]
  fetchData: (params: { page: number; limit: number; search: string; sortBy?: string; sortOrder?: "asc" | "desc"; filters?: Record<string, any> }) => Promise<{ data: T[]; total: number }>
  createUrl?: string
  editUrl?: (row: T) => string
  deleteAction?: (id: string) => Promise<void>
  defaultFilters?: Record<string, any>
  exportable?: boolean
  pageSize?: number
}

export function DataTable<T extends { id: string }>({
  title,
  columns,
  fetchData,
  createUrl,
  editUrl,
  deleteAction,
  defaultFilters = {},
  exportable = false,
  pageSize = 10,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [filters, setFilters] = useState<Record<string, any>>(defaultFilters)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [page, search, sortBy, sortOrder, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await fetchData({
        page,
        limit: pageSize,
        search,
        sortBy,
        sortOrder,
        filters,
      })
      setData(result.data)
      setTotal(result.total)
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return
    try {
      await deleteAction?.(id)
      toast.success("Data berhasil dihapus")
      loadData()
    } catch (error) {
      console.error("Error deleting:", error)
      toast.error("Gagal menghapus data")
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <span className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
            {total} data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4 mr-1" /> Filter
          </button>
          {exportable && (
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 rounded-lg transition-colors">
              <Download className="w-4 h-4 mr-1" /> Ekspor
            </button>
          )}
          {createUrl && (
            <a href={createUrl}>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-5 pb-4 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <Input
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="lg:col-span-2"
            />
            <Select value={filters.status || ""} onValueChange={(v) => setFilters({ ...filters, status: v || undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-sm text-slate-500 hover:text-emerald-600"
            >
              Reset Filter
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`pb-3 px-4 ${col.sortable ? "cursor-pointer hover:bg-slate-50" : ""}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortBy === col.key && (
                      sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="pb-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-slate-50/50 hover:bg-slate-50/50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-4 px-4 text-sm text-slate-700">
                      {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "-")}
                    </td>
                  ))}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editUrl && (
                        <a
                          href={editUrl(row)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Lihat"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      {deleteAction && (
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Menampilkan {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} dari {total} data
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? "bg-emerald-600 text-white"
                        : "text-slate-600 hover:bg-emerald-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}