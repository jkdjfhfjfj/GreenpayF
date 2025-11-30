import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Download,
  AlertCircle,
  Info,
  AlertTriangle,
  Eye
} from "lucide-react";

interface SystemLog {
  id: string;
  userId: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  source: string;
  timestamp: Date;
  data?: any;
}

const levelConfig = {
  info: { icon: Info, color: "bg-blue-100 text-blue-800", label: "Info" },
  warn: { icon: AlertTriangle, color: "bg-yellow-100 text-yellow-800", label: "Warning" },
  error: { icon: AlertCircle, color: "bg-red-100 text-red-800", label: "Error" },
  debug: { icon: Eye, color: "bg-gray-100 text-gray-800", label: "Debug" },
};

export default function UserActivityLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    try {
      let filtered = logs || [];

      // Extract unique users for filter dropdown - filter out empty/undefined
      const users = Array.from(
        new Set(
          logs
            .map((log) => log?.userId)
            .filter((id) => id && id.trim() && id !== "system")
        )
      ).sort();
      setUniqueUsers(users);

      // Filter by search term
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            (log?.userId?.toLowerCase()?.includes(searchLower) || false) ||
            (log?.message?.toLowerCase()?.includes(searchLower) || false) ||
            (log?.source?.toLowerCase()?.includes(searchLower) || false)
        );
      }

      // Filter by user
      if (userFilter && userFilter !== "all") {
        filtered = filtered.filter((log) => {
          return log?.userId === userFilter;
        });
      }

      // Filter by level
      if (levelFilter && levelFilter !== "all") {
        filtered = filtered.filter((log) => log?.level === levelFilter);
      }

      setFilteredLogs(filtered);
    } catch (error) {
      console.error("Error filtering logs:", error);
      setFilteredLogs(logs || []);
    }
  }, [logs, searchTerm, userFilter, levelFilter]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/user-activities");
      if (response.ok) {
        const data = await response.json();
        const parsedLogs = data.map((log: any) => {
          // Ensure userId is correctly extracted from source
          const userId = log.userId || (log.source ? log.source.split(":")[1] : "system");
          return {
            ...log,
            userId: userId || "system",
            timestamp: new Date(log.timestamp),
          };
        });
        setLogs(parsedLogs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportLogs = () => {
    const csv = [
      ["User ID", "Level", "Message", "Source", "Timestamp"],
      ...filteredLogs.map((log) => [
        log.userId,
        log.level,
        log.message,
        log.source,
        log.timestamp.toISOString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by message, source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 min-w-max"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 min-w-max"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" className="flex-1 sm:flex-none">
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" className="flex-1 sm:flex-none">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Detail View */}
      {showDetail && selectedLog && (
        <Card className="border-blue-300 dark:border-blue-700">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/30">
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Full Log Details</span>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>✕</Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">User ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedLog.userId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Level</p>
                <Badge className="mt-1">{selectedLog.level.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Source</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedLog.source}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Timestamp</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedLog.timestamp.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Message</p>
              <p className="text-sm text-gray-900 dark:text-white break-words bg-gray-50 dark:bg-gray-800 p-3 rounded">
                {selectedLog.message}
              </p>
            </div>

            {selectedLog.data && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Full Data</p>
                <pre className="text-xs bg-gray-900 dark:bg-gray-950 text-gray-200 p-4 rounded overflow-auto max-h-60 font-mono border border-gray-700">
                  {typeof selectedLog.data === "string"
                    ? selectedLog.data
                    : JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin">Loading logs...</div>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center py-8 text-gray-500">
            No console logs found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs && filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              if (!log || !log.id) return null;
              
              const config = levelConfig[log.level as keyof typeof levelConfig] || levelConfig.info;
              const Icon = config?.icon || Info;

              return (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${config?.color || "bg-gray-100 text-gray-800"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              User: {log.userId || "unknown"}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {log.source || "system"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                            {log.message || "No message"}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span>{log.timestamp?.toLocaleString?.() || "No timestamp"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={config?.color || "bg-gray-100 text-gray-800"}>
                          {config?.label || "Unknown"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetail(true);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex justify-center py-8 text-gray-500">
                No logs match your filters
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(levelConfig).map(([level, config]) => {
            const count = logs.filter((log) => log.level === level).length;
            const Label = config.icon;
            return (
              <Card key={level}>
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className={`inline-block p-2 rounded mb-1 ${config.color}`}>
                      <Label className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{level}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
