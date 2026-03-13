import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Loader2,
  HardDrive,
  Shield,
} from "lucide-react";
import { Axios, BASE_URL } from "../../api/api";
import { useConfirm } from "../Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Stats {
  stockItems: number;
  stocks: number;
  stockTransactions: number;
  costs: number;
  dateRange: { from: string; to: string } | null;
}

export default function DataManagement() {
  const auth = useAuthUser()() as { wing: string };
  const confirm = useConfirm()!;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wing, setWing] = useState(auth.wing === "ALL" ? "MALE" : auth.wing);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purging, setPurging] = useState(false);
  const [lastRestore, setLastRestore] = useState<{ restored: Record<string, number>; wing: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await Axios.get(`/stock/backup/stats?wing=${wing}`);
      setStats(res.data);
    } catch {
      toast.error("Failed to load data statistics");
    } finally {
      setLoadingStats(false);
    }
  }, [wing]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await Axios.get(`/stock/backup?wing=${wing}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sohozmeal-backup-${wing.toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully");
    } catch {
      toast.error("Failed to download backup");
    } finally {
      setDownloading(false);
    }
  };

  const handleRestore = async (file: File) => {
    // Validate file
    if (!file.name.endsWith(".json")) {
      toast.error("Please select a JSON backup file");
      return;
    }

    // Read and preview the backup
    let backup: { version?: string; wing?: string; data?: unknown; createdAt?: string; counts?: { stockItems?: number; stockTransactions?: number; costs?: number } };
    try {
      const text = await file.text();
      backup = JSON.parse(text);
    } catch {
      toast.error("Invalid JSON file");
      return;
    }

    if (!backup.version || !backup.wing || !backup.data) {
      toast.error("Invalid backup format");
      return;
    }

    const ok = await confirm({
      title: "Restore Backup?",
      description: `This will REPLACE all existing ${backup.wing} wing stock data with the backup from ${backup.createdAt?.split("T")[0] || "unknown date"}.\n\nBackup contains: ${backup.counts?.stockItems || 0} items, ${backup.counts?.stockTransactions || 0} transactions, ${backup.counts?.costs || 0} cost records.\n\nThis action cannot be undone. Student data will NOT be affected.`,
      confirmText: "Restore",
      cancelText: "Cancel",
    });

    if (!ok) return;

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append("backup", file);
      const res = await Axios.post(`/stock/restore?mode=replace`, formData);
      setLastRestore(res.data);
      toast.success(`Backup restored successfully for ${backup.wing} wing`);
      fetchStats();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to restore backup");
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePurge = async () => {
    const ok = await confirm({
      title: "Purge All Stock Data?",
      description: `This will permanently delete ALL stock items, stock records, transactions, and cost/bill records for the ${wing} wing.\n\nStudent data, meal plans, hall feasts, and other data will NOT be affected.\n\nThis action CANNOT be undone. Download a backup first if you need to preserve this data.`,
      confirmText: "Purge All Data",
      cancelText: "Cancel",
    });

    if (!ok) return;

    // Double confirmation for safety
    const reallyOk = await confirm({
      title: "Are you absolutely sure?",
      description: `You are about to delete ${stats?.stockTransactions || "all"} transactions, ${stats?.stockItems || "all"} stock items, and ${stats?.costs || "all"} cost records for ${wing} wing. This is irreversible.`,
      confirmText: `Yes, purge ${wing} data`,
      cancelText: "No, keep data",
    });

    if (!reallyOk) return;

    setPurging(true);
    try {
      const res = await Axios.delete(`/stock/purge?wing=${wing}`);
      const d = res.data.deleted;
      toast.success(`Purged: ${d.stockItems} items, ${d.stockTransactions} transactions, ${d.costs} cost records`);
      fetchStats();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to purge data");
    } finally {
      setPurging(false);
    }
  };

  const totalRecords = stats ? stats.stockItems + stats.stocks + stats.stockTransactions + stats.costs : 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Backup, restore, and manage stock-related data
          </p>
        </div>
        {auth.wing === "ALL" && (
          <Select value={wing} onValueChange={setWing}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Current Data Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Current Data — {wing} Wing
          </CardTitle>
          <CardDescription>
            Overview of stock-related records currently in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading statistics...
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Stock Items" value={stats.stockItems} />
                <StatBox label="Stock Records" value={stats.stocks} />
                <StatBox label="Transactions" value={stats.stockTransactions} />
                <StatBox label="Cost Records" value={stats.costs} />
              </div>
              {stats.dateRange && (
                <p className="text-xs text-muted-foreground">
                  Transaction date range: <span className="font-medium text-foreground">{stats.dateRange.from}</span>{" "}
                  to <span className="font-medium text-foreground">{stats.dateRange.to}</span>
                </p>
              )}
              {totalRecords === 0 && (
                <p className="text-sm text-muted-foreground italic">No stock data found for this wing</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load statistics</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backup */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              Download Backup
            </CardTitle>
            <CardDescription>
              Export all stock data as a JSON file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Includes: Stock Items, Stock Records, Transactions, Cost/Bill Records</p>
              <p>Does NOT include: Students, Meals, Hall Feasts</p>
            </div>
            <Button
              onClick={handleDownload}
              disabled={downloading || totalRecords === 0}
              className="w-full gap-2"
              variant="outline"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              {downloading ? "Downloading..." : `Download ${wing} Wing Backup`}
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-green-600" />
              Restore from Backup
            </CardTitle>
            <CardDescription>
              Import a previously downloaded backup file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Replaces existing data for the wing specified in the backup file</p>
              <p className="flex items-center gap-1 text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Existing stock data will be overwritten
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleRestore(file);
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoring}
              className="w-full gap-2"
              variant="outline"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {restoring ? "Restoring..." : "Select Backup File"}
            </Button>
            {lastRestore && (
              <div className="rounded-md bg-green-50 border border-green-200 p-2.5 text-xs">
                <p className="font-medium text-green-700 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Last restore ({lastRestore.wing} wing)
                </p>
                <p className="text-green-600">
                  {lastRestore.restored.stockItems} items, {lastRestore.restored.stockTransactions} transactions,{" "}
                  {lastRestore.restored.costs} cost records
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <Trash2 className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete all stock-related data for a wing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs space-y-1.5">
            <p className="font-medium text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              This will permanently delete:
            </p>
            <ul className="text-red-600 list-disc list-inside space-y-0.5 ml-1">
              <li>All stock items and stock records</li>
              <li>All stock transactions (IN/OUT)</li>
              <li>All daily cost/bill records</li>
            </ul>
            <p className="text-red-600 flex items-center gap-1.5 pt-1">
              <Shield className="h-3.5 w-3.5" />
              Student data, meal plans, and hall feasts will NOT be affected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              onClick={handlePurge}
              disabled={purging || totalRecords === 0}
              className="gap-2"
            >
              {purging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {purging ? "Purging..." : `Purge ${wing} Wing Data`}
            </Button>
            {totalRecords === 0 && (
              <span className="text-xs text-muted-foreground">No data to purge</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
