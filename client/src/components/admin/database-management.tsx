import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

interface DatabaseStatus {
  connected: boolean;
  status: "connected" | "disconnected" | "error";
  message: string;
  lastBackup?: string;
  backupSize?: string;
  tableCount?: number;
  recordCount?: number;
}

interface ExportProgress {
  status: "idle" | "exporting" | "completed" | "error";
  progress: number;
  message: string;
}

interface ImportProgress {
  status: "idle" | "importing" | "completed" | "error";
  progress: number;
  message: string;
}

export default function DatabaseManagement() {
  const { toast } = useToast();
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: ""
  });
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    status: "idle",
    progress: 0,
    message: ""
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check database connection status
  const { data: dbStatus, isLoading, refetch } = useQuery<DatabaseStatus>({
    queryKey: ["/api/admin/database/status"],
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 5000,
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      setExportProgress({
        status: "exporting",
        progress: 20,
        message: "Preparing database export..."
      });

      try {
        const response = await fetch("/api/admin/database/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) throw new Error("Export failed");

        setExportProgress({
          status: "exporting",
          progress: 60,
          message: "Exporting data..."
        });

        const blob = await response.blob();
        const timestamp = new Date().toISOString().split('T')[0];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `greenpay_backup_${timestamp}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setExportProgress({
          status: "completed",
          progress: 100,
          message: "Export completed successfully!"
        });

        toast({
          title: "Success",
          description: "Database exported successfully",
        });

        setTimeout(() => {
          setExportProgress({ status: "idle", progress: 0, message: "" });
        }, 3000);
      } catch (error) {
        setExportProgress({
          status: "error",
          progress: 0,
          message: "Export failed: " + (error as Error).message
        });
        toast({
          title: "Error",
          description: "Failed to export database",
          variant: "destructive"
        });
      }
    }
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      setImportProgress({
        status: "importing",
        progress: 20,
        message: "Reading file..."
      });

      try {
        const formData = new FormData();
        formData.append("file", file);

        setImportProgress({
          status: "importing",
          progress: 50,
          message: "Uploading backup file..."
        });

        const response = await fetch("/api/admin/database/import", {
          method: "POST",
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Import failed");
        }

        setImportProgress({
          status: "importing",
          progress: 80,
          message: "Restoring database..."
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        setImportProgress({
          status: "completed",
          progress: 100,
          message: "Import completed successfully!"
        });

        toast({
          title: "Success",
          description: "Database imported successfully",
        });

        setTimeout(() => {
          setImportProgress({ status: "idle", progress: 0, message: "" });
          refetch();
        }, 3000);
      } catch (error) {
        setImportProgress({
          status: "error",
          progress: 0,
          message: "Import failed: " + (error as Error).message
        });
        toast({
          title: "Error",
          description: "Failed to import database",
          variant: "destructive"
        });
      }
    }
  });

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sql";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        importMutation.mutate(file);
      }
    };
    input.click();
  };

  const statusColor = dbStatus?.connected 
    ? "text-green-600" 
    : dbStatus?.status === "error"
    ? "text-red-600"
    : "text-yellow-600";

  return (
    <div className="space-y-6">
      {/* Database Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </CardTitle>
          <CardDescription>
            Real-time database connection and health information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking database connection...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {dbStatus?.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{dbStatus?.message}</p>
                    <p className="text-sm text-gray-500">
                      {dbStatus?.connected ? "Connected and operational" : "Unable to connect to database"}
                    </p>
                  </div>
                </div>
                <Badge variant={dbStatus?.connected ? "default" : "destructive"}>
                  {dbStatus?.status.toUpperCase()}
                </Badge>
              </div>

              {dbStatus?.connected && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tables</p>
                    <p className="text-2xl font-bold text-blue-600">{dbStatus?.tableCount || 0}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Records</p>
                    <p className="text-2xl font-bold text-green-600">{dbStatus?.recordCount || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Last Backup</p>
                    <p className="text-sm font-bold text-orange-600">
                      {dbStatus?.lastBackup ? new Date(dbStatus.lastBackup).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Database
          </CardTitle>
          <CardDescription>
            Create a complete backup of your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportProgress.status !== "idle" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{exportProgress.message}</span>
                <span className="text-sm text-gray-500">{exportProgress.progress}%</span>
              </div>
              <Progress value={exportProgress.progress} />
              {exportProgress.status === "completed" && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {exportProgress.message}
                </p>
              )}
              {exportProgress.status === "error" && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {exportProgress.message}
                </p>
              )}
            </div>
          )}
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={!dbStatus?.connected || exportMutation.isPending || exportProgress.status === "exporting"}
            className="w-full"
          >
            {exportMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Now
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500">
            This will download a complete SQL backup of all database tables and records.
          </p>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Database
          </CardTitle>
          <CardDescription>
            Restore from a previously created backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importProgress.status !== "idle" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{importProgress.message}</span>
                <span className="text-sm text-gray-500">{importProgress.progress}%</span>
              </div>
              <Progress value={importProgress.progress} />
              {importProgress.status === "completed" && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {importProgress.message}
                </p>
              )}
              {importProgress.status === "error" && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {importProgress.message}
                </p>
              )}
            </div>
          )}
          <Button
            onClick={handleImportClick}
            disabled={!dbStatus?.connected || importMutation.isPending || importProgress.status === "importing"}
            variant="outline"
            className="w-full"
          >
            {importMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import from File
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500">
            Select a .sql backup file to restore your database to a previous state.
          </p>
        </CardContent>
      </Card>

      {/* Auto-refresh toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh status every 30 seconds</span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
