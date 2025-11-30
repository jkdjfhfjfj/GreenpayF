import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Upload, Loader2, CheckCircle, XCircle, Eye, FileJson } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Backup {
  id: string;
  filename: string;
  createdAt: string;
  size: number;
  tablesCount: number;
  recordsCount: number;
}

export default function DatabaseManagement() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  const checkDatabaseConnection = async () => {
    setIsCheckingConnection(true);
    try {
      const response = await fetch("/api/admin/database/check");
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      setConnectionStatus({
        connected: false,
        message: error instanceof Error ? error.message : "Connection check failed",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleExportDatabase = async () => {
    if (!connectionStatus?.connected) {
      setMessage({ type: "error", text: "Database connection failed. Please check your connection." });
      return;
    }

    setIsExporting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/database/backup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: "Database exported successfully!" });
        // Trigger download
        const element = document.createElement("a");
        element.href = `/api/admin/database/backup/${data.backup.id}/download`;
        element.download = data.backup.filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      setMessage({ type: "error", text: `Failed to export database: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsExporting(false);
    }
  };

  const previewFile = async (file: File) => {
    try {
      const text = await file.text();
      const preview = text.substring(0, 500) + (text.length > 500 ? "\n...[truncated]" : "");
      setFilePreview(preview);
      setShowPreview(true);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to read file preview" });
    }
  };

  const handleRestoreDatabase = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a backup file" });
      return;
    }

    if (!connectionStatus?.connected) {
      setMessage({ type: "error", text: "Database connection failed. Please check your connection." });
      return;
    }

    setIsRestoring(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/database/restore", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: `Database restored successfully! Restored ${Object.values(data.recordsRestored).reduce((a: number, b: number) => a + b, 0)} records.` 
        });
        setSelectedFile(null);
        setShowPreview(false);
        setFilePreview(null);
      } else {
        setMessage({ type: "error", text: `Restore failed: ${data.error || "Unknown error"}` });
      }
    } catch (error) {
      setMessage({ type: "error", text: `Failed to restore database: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={connectionStatus?.connected ? "border-green-200" : "border-red-200"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCheckingConnection ? (
                <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
              ) : connectionStatus?.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-semibold">{connectionStatus?.connected ? "Connected" : "Disconnected"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{connectionStatus?.message}</p>
              </div>
            </div>
            <Button onClick={checkDatabaseConnection} variant="outline" size="sm">
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Database
          </CardTitle>
          <CardDescription>Create a complete backup of your database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-400">
              This will export all data from all tables in your database as a compressed file.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleExportDatabase} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Database Now
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Restore Database
          </CardTitle>
          <CardDescription>Restore database from a previously exported file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-400">
              Warning: This will replace all current database data with the imported backup.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Backup File
            </label>
            <input
              type="file"
              accept=".json,.sql,.gz"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              disabled={isRestoring}
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            )}
          </div>

          <Button 
            onClick={handleRestoreDatabase} 
            disabled={isRestoring || !selectedFile}
            className="w-full"
            variant="destructive"
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Restore from File
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Messages */}
      {message && (
        <Alert className={message.type === "success" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800 dark:text-green-400" : "text-red-800 dark:text-red-400"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Backups List */}
      {backups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Backups</CardTitle>
            <CardDescription>Your exported database backups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{backup.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(backup.createdAt)} • {formatBytes(backup.size)} • {backup.tablesCount} tables • {backup.recordsCount} records
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const element = document.createElement("a");
                      element.href = `/api/admin/database/backup/${backup.id}/download`;
                      element.download = backup.filename;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
