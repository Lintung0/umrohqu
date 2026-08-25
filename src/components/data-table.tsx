"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  Loader2,
  X,
  AlertTriangle,
  Clock,
  Activity,
  Check,
  Loader,
} from "lucide-react";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  name?: string;
  tenant_name?: string;
  customer_name?: string;
  package_name?: string;
  amount?: number;
  reason?: string;
  bid_value?: number;
  contact_email?: string;
  contact_phone?: string;
  slug?: string;
  created_at?: string;
  date?: string;
  tenants?: { name: string };
  packages?: { name: string };
}

interface ActionCenterData {
  onboarding: { count: number; items: TaskItem[] };
  withdrawal: { count: number; items: TaskItem[] };
  refund: { count: number; items: TaskItem[] };
  bidding: { count: number; items: TaskItem[] };
}

interface TaskRow {
  id: string;
  category: "onboarding" | "withdrawal" | "refund" | "bidding";
  vendor_name: string;
  request_type: string;
  request_status: "Menunggu" | "Diproses" | "Selesai";
  detail: string;
  amount?: number;
  date: string;
  badgeColor: string;
  rawItem: TaskItem;
}

interface DataTableProps {
  data?: any;
}

export function DataTable({ data: initialData }: DataTableProps) {
  const [data, setData] = React.useState<ActionCenterData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTaskType, setActiveTaskType] = React.useState<
    "onboarding" | "withdrawal" | "refund" | "bidding" | null
  >(null);
  const [activeItem, setActiveItem] = React.useState<TaskRow | null>(null);
  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/dashboard/action-center");
      if (!res.ok) throw new Error("Gagal mengambil data Action Center");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  React.useEffect(() => {
    if (!data) return;

    const mappedRows: TaskRow[] = [];

    // Onboarding
    data.onboarding.items.forEach((item, idx) => {
      mappedRows.push({
        id: item.id,
        category: "onboarding",
        vendor_name: item.name || "PT. Travel Partner",
        request_type: "Pendaftaran",
        request_status: idx === 0 ? "Menunggu" : "Diproses",
        detail: `Domain: ${item.slug}.umrohq.id`,
        date: item.created_at || new Date().toISOString(),
        badgeColor:
          "rounded-xl bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200",
        rawItem: item,
      });
    });

    // Withdrawal
    data.withdrawal.items.forEach((item, idx) => {
      mappedRows.push({
        id: item.id,
        category: "withdrawal",
        vendor_name: item.tenant_name || "Travel Partner",
        request_type: "Pencairan",
        request_status: idx === 0 ? "Menunggu" : "Diproses",
        detail: `Pencairan ${formatRupiah(item.amount || 0)}`,
        amount: item.amount,
        date: item.date || new Date().toISOString(),
        badgeColor:
          "rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-200",
        rawItem: item,
      });
    });

    // Refund
    data.refund.items.forEach((item, idx) => {
      mappedRows.push({
        id: item.id,
        category: "refund",
        vendor_name: item.customer_name || "Nama Jamaah",
        request_type: "Pengembalian",
        request_status: "Menunggu",
        detail: `Paket: ${item.package_name}`,
        amount: item.amount,
        date: item.date || new Date().toISOString(),
        badgeColor:
          "rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200",
        rawItem: item,
      });
    });

    // Bidding
    data.bidding.items.forEach((item, idx) => {
      mappedRows.push({
        id: item.id,
        category: "bidding",
        vendor_name: item.tenants?.name || "Travel Partner",
        request_type: "Bidding",
        request_status: "Diproses",
        detail: `Paket: ${item.packages?.name}`,
        amount: item.bid_value,
        date: item.created_at || new Date().toISOString(),
        badgeColor:
          "rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200",
        rawItem: item,
      });
    });

    mappedRows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setRows(mappedRows);
  }, [data]);

  const handleStatusChange = (
    itemId: string,
    newStatus: "Menunggu" | "Diproses" | "Selesai",
    name: string,
  ) => {
    toast.success(`Status ${name} diperbarui ke ${newStatus}!`);
    setRows((prev) =>
      prev.map((row) =>
        row.id === itemId ? { ...row, request_status: newStatus } : row,
      ),
    );
    setActiveTaskType(null);
    setActiveItem(null);
  };

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const matchTab = activeTab === "all" || row.category === activeTab;
      const matchStatus =
        statusFilter === "all" || row.request_status === statusFilter;
      return matchTab && matchStatus;
    });
  }, [rows, activeTab, statusFilter]);

  const columns = React.useMemo<ColumnDef<TaskRow>[]>(
    () => [
      {
        accessorKey: "vendor_name",
        header: "Nama Vendor",
        cell: ({ row }) => (
          <div className="font-semibold text-sm text-foreground">
            {row.original.vendor_name}
          </div>
        ),
      },
      {
        accessorKey: "request_type",
        header: "Jenis Permintaan",
        cell: ({ row }) => {
          const val = row.original;
          return (
            <Badge
              variant="outline"
              className={`px-2.5 py-0.5 text-xs font-semibold ${val.badgeColor}`}
            >
              {val.request_type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "request_status",
        header: "Status Permintaan",
        cell: ({ row }) => {
          const status = row.original.request_status;

          if (status === "Menunggu") {
            return (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-500/20 bg-yellow-50/50 dark:text-yellow-400 dark:bg-yellow-950/20 gap-1 rounded-xl font-semibold"
              >
                <Clock className="h-3 w-3" />
                Menunggu
              </Badge>
            );
          } else if (status === "Diproses") {
            return (
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-500/20 bg-blue-50/50 dark:text-blue-400 dark:bg-blue-950/20 gap-1 rounded-xl font-semibold"
              >
                <Loader className="h-3 w-3 animate-spin" />
                Diproses
              </Badge>
            );
          } else {
            return (
              <Badge
                variant="outline"
                className="text-green-600 border-green-500/20 bg-green-50/50 dark:text-green-400 dark:bg-green-950/20 gap-1 rounded-xl font-semibold"
              >
                <Check className="h-3 w-3" />
                Selesai
              </Badge>
            );
          }
        },
      },
      {
        accessorKey: "detail",
        header: "Keterangan",
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground max-w-xs truncate font-medium">
            {row.original.detail}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Tanggal Masuk",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-medium">
            {new Date(row.original.date).toLocaleString("id-ID", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="text-right">
              {row.original.request_status !== "Selesai" ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium gap-1 px-3 group"
                onClick={() => {
                  setActiveTaskType(row.original.category);
                  setActiveItem(row.original);
                }}
              >
                Proses
                <ChevronRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
              </Button>
            ) : (
              <Badge
                variant="outline"
                className="text-green-700 border-green-500/20 bg-green-50/50 dark:text-green-400 dark:bg-green-950/20 gap-1 rounded-xl font-bold"
              >
                Selesai
              </Badge>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-xs text-muted-foreground">Memuat...</span>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-6 space-y-3">
      {/* Controls: Tabs & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="grid grid-cols-5 h-9 w-full sm:w-auto">
            <TabsTrigger value="all" className="text-xs">
              Semua
            </TabsTrigger>
            <TabsTrigger value="bidding" className="text-xs">
              Bidding
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="text-xs">
              Pencairan
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="text-xs">
              Pendaftaran
            </TabsTrigger>
            <TabsTrigger value="refund" className="text-xs">
              Pengembalian
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            if (val) setStatusFilter(val);
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-9 text-xs" size="sm">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="text-xs rounded-lg">
              Semua Status
            </SelectItem>
            <SelectItem value="Menunggu" className="text-xs rounded-lg">
              Menunggu
            </SelectItem>
            <SelectItem value="Diproses" className="text-xs rounded-lg">
              Diproses
            </SelectItem>
            <SelectItem value="Selesai" className="text-xs rounded-lg">
              Selesai
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                  className="hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center text-xs text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Approval Dialog */}
      {activeTaskType && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-card border border-border">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Panel Persetujuan: {activeItem.request_type}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActiveTaskType(null);
                  setActiveItem(null);
                }}
                className="h-8 w-8 rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              {(() => {
                const item = activeItem.rawItem;
                if (!item) return null;

                return (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800 dark:bg-amber-950/20 dark:border-amber-500/20 dark:text-amber-300">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Aksi Admin Diperlukan</p>
                        <p className="mt-0.5 leading-relaxed">
                          Harap verifikasi informasi di bawah ini dengan teliti
                          sebelum menyetujui atau menolak.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                      {activeTaskType === "onboarding" && (
                        <>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Nama Travel:
                            </span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {item.name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Slug Subdomain:
                            </span>
                            <span className="col-span-2 font-mono font-medium text-foreground">
                              {item.slug}.umrohq.id
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Email Kontak:
                            </span>
                            <span className="col-span-2 text-foreground font-medium">
                              {item.contact_email}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Nomor Telepon:
                            </span>
                            <span className="col-span-2 text-foreground font-medium">
                              {item.contact_phone}
                            </span>
                          </div>
                        </>
                      )}

                      {activeTaskType === "withdrawal" && (
                        <>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Travel Partner:
                            </span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {item.tenant_name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Nilai Pencairan:
                            </span>
                            <span className="col-span-2 text-base font-bold text-red-600 dark:text-red-500">
                              {formatRupiah(item.amount || 0)}
                            </span>
                          </div>
                        </>
                      )}

                      {activeTaskType === "refund" && (
                        <>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Nama Jamaah:
                            </span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {item.customer_name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Paket Umrah:
                            </span>
                            <span className="col-span-2 text-foreground font-medium">
                              {item.package_name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Jumlah Refund:
                            </span>
                            <span className="col-span-2 text-base font-bold text-amber-600 dark:text-amber-500">
                              {formatRupiah(item.amount || 0)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Alasan:
                            </span>
                            <span className="col-span-2 text-foreground font-medium leading-relaxed font-sans">
                              "{item.reason}"
                            </span>
                          </div>
                        </>
                      )}

                      {activeTaskType === "bidding" && (
                        <>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Travel Partner:
                            </span>
                            <span className="col-span-2 font-semibold text-foreground">
                              {item.tenants?.name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Paket Sponsor:
                            </span>
                            <span className="col-span-2 text-foreground font-medium">
                              {item.packages?.name}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 text-xs">
                            <span className="text-muted-foreground">
                              Nilai Bidding:
                            </span>
                            <span className="col-span-2 text-sm font-bold text-primary">
                              {formatRupiah(item.bid_value || 0)} / hari
                            </span>
                          </div>
                        </>
                      )}

                      <div className="grid grid-cols-3 text-xs pt-1 border-t border-border/60">
                        <span className="text-muted-foreground">
                          Tanggal Pengajuan:
                        </span>
                        <span className="col-span-2 text-muted-foreground">
                          {new Date(
                            item.created_at || item.date || "",
                          ).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <Button
                        variant="ghost"
                        className="flex-1 text-destructive hover:bg-destructive/10 text-xs h-9"
                        onClick={() =>
                          handleStatusChange(
                            activeItem.id,
                            "Menunggu",
                            activeTaskType === "onboarding"
                              ? item.name || ""
                              : activeTaskType === "withdrawal"
                                ? item.tenant_name || ""
                                : activeTaskType === "refund"
                                  ? item.customer_name || ""
                                  : item.tenants?.name || "",
                          )
                        }
                      >
                        Atur Menunggu
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-primary hover:bg-primary/10 text-xs h-9"
                        onClick={() =>
                          handleStatusChange(
                            activeItem.id,
                            "Diproses",
                            activeTaskType === "onboarding"
                              ? item.name || ""
                              : activeTaskType === "withdrawal"
                                ? item.tenant_name || ""
                                : activeTaskType === "refund"
                                  ? item.customer_name || ""
                                  : item.tenants?.name || "",
                          )
                        }
                      >
                        Atur Diproses
                      </Button>
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/80 text-xs h-9"
                        onClick={() =>
                          handleStatusChange(
                            activeItem.id,
                            "Selesai",
                            activeTaskType === "onboarding"
                              ? item.name || ""
                              : activeTaskType === "withdrawal"
                                ? item.tenant_name || ""
                                : activeTaskType === "refund"
                                  ? item.customer_name || ""
                                  : item.tenants?.name || "",
                          )
                        }
                      >
                        Atur Selesai
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
