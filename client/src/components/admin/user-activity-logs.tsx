import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  Unlock,
  FileCheck,
  CreditCard,
  LogOut,
  LogIn,
  Trash2,
  Search,
  Download
} from "lucide-react";

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  description: string;
  type: "login" | "transaction" | "kyc" | "card" | "security" | "account" | "logout";
  timestamp: Date;
  ipAddress?: string;
  metadata?: any;
}

const activityTypeConfig = {
  login: { icon: LogIn, color: "bg-blue-100 text-blue-800", label: "Login" },
  logout: { icon: LogOut, color: "bg-gray-100 text-gray-800", label: "Logout" },
  transaction: { icon: ArrowUpRight, color: "bg-green-100 text-green-800", label: "Transaction" },
  kyc: { icon: FileCheck, color: "bg-purple-100 text-purple-800", label: "KYC" },
  card: { icon: CreditCard, color: "bg-orange-100 text-orange-800", label: "Card" },
  security: { icon: Lock, color: "bg-red-100 text-red-800", label: "Security" },
  account: { icon: Unlock, color: "bg-yellow-100 text-yellow-800", label: "Account" },
};

export default function UserActivityLogs() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    let filtered = activities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchTerm, typeFilter]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/user-activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(
          data.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportActivities = () => {
    const csv = [
      ["User Name", "Email", "Action", "Type", "Timestamp", "IP Address"],
      ...filteredActivities.map((a) => [
        a.userName,
        a.userEmail,
        a.description,
        a.type,
        a.timestamp.toISOString(),
        a.ipAddress || "N/A",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-activities-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by user name, email, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="all">All Types</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="transaction">Transaction</option>
          <option value="kyc">KYC</option>
          <option value="card">Card</option>
          <option value="security">Security</option>
          <option value="account">Account</option>
        </select>
        <Button onClick={exportActivities} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Activity List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin">Loading...</div>
          </CardContent>
        </Card>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center py-8 text-gray-500">
            No activities found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map((activity) => {
            const config = activityTypeConfig[activity.type as keyof typeof activityTypeConfig];
            const Icon = config?.icon || Trash2;

            return (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${config?.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {activity.userName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.userEmail}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.description}
                        </p>
                        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>{activity.timestamp.toLocaleString()}</span>
                          {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge className={config?.color}>{config?.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {activities.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
          {Object.entries(activityTypeConfig).map(([type, config]) => {
            const count = activities.filter((a) => a.type === type).length;
            const Label = config.icon;
            return (
              <Card key={type}>
                <CardContent className="p-3">
                  <div className="text-center">
                    <div className={`inline-block p-2 rounded mb-1 ${config.color}`}>
                      <Label className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium">{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{type}</p>
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
