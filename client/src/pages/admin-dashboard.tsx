import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  FileCheck, 
  Activity, 
  Shield,
  Settings,
  LogOut,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  LayoutDashboard,
  BarChart3,
  Menu,
  X,
  MessageCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import UserManagement from "@/components/admin/user-management";
import KycManagement from "@/components/admin/kyc-management";
import TransactionManagement from "@/components/admin/transaction-management";
import VirtualCardManagement from "@/components/admin/virtual-card-management";
import AdminSettings from "@/components/admin/admin-settings";
import MessagingSettings from "@/components/admin/messaging-settings";
import WhatsAppTemplates from "@/components/admin/whatsapp-templates";
import WhatsAppMessaging from "@/components/admin/whatsapp-messaging";

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  totalVolume: number;
  totalRevenue: number;
  pendingKyc: number;
}

interface TransactionTrend {
  date: string;
  count: number;
  volume: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  transactionTrends: TransactionTrend[];
  recentTransactions: any[];
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminData, setAdminData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const admin = localStorage.getItem("adminAuth");
    if (!admin) {
      setLocation("/admin/login");
      return;
    }
    setAdminData(JSON.parse(admin));
  }, [setLocation]);

  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    enabled: !!adminData,
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setLocation("/admin/login");
  };

  if (!adminData) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { metrics, transactionTrends, recentTransactions } = dashboardData!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-700 dark:to-emerald-800 border-b border-green-600 dark:border-green-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">GreenPay Admin</h1>
                <p className="text-sm text-white/80">Administrative Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminData.fullName}</p>
                <p className="text-xs text-white/80">{adminData.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-admin-logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="grid grid-cols-10 w-full md:w-auto inline-grid md:inline-flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="kyc">KYC</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="cards">Virtual Cards</TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="messaging">Messaging</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="logs">Security Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-users">{metrics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeUsers} active, {metrics.blockedUsers} blocked
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-transactions">{metrics.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.completedTransactions} completed, {metrics.pendingTransactions} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-total-volume">${metrics.totalVolume.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    Revenue: ${metrics.totalRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
                  <FileCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="metric-pending-kyc">{metrics.pendingKyc}</div>
                  <p className="text-xs text-muted-foreground">
                    Require review
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Trends (7 Days)</CardTitle>
                  <CardDescription>Daily transaction volume and count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={transactionTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#10b981" name="Count" />
                      <Line type="monotone" dataKey="volume" stroke="#3b82f6" name="Volume ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest 10 transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 5).map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{txn.type.toUpperCase()}</p>
                          <p className="text-xs text-gray-500">{txn.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{txn.currency?.toUpperCase() === 'KES' ? 'KSh ' : '$'}{txn.amount}</p>
                          <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                            {txn.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setLocation("/admin/kyc")}
                    data-testid="button-review-kyc"
                  >
                    <FileCheck className="w-4 h-4" />
                    Review KYC ({metrics.pendingKyc})
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setLocation("/admin/users")}
                    data-testid="button-manage-users"
                  >
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setLocation("/admin/transactions")}
                    data-testid="button-monitor-transactions"
                  >
                    <Activity className="w-4 h-4" />
                    Monitor Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          <TabsContent value="kyc">
            <AdminKycTab />
          </TabsContent>

          <TabsContent value="transactions">
            <AdminTransactionsTab />
          </TabsContent>

          <TabsContent value="cards">
            <AdminCardsTab />
          </TabsContent>

          <TabsContent value="whatsapp">
            <AdminWhatsAppTab />
          </TabsContent>

          <TabsContent value="messaging">
            <MessagingSettings />
          </TabsContent>

          <TabsContent value="templates">
            <WhatsAppTemplates />
          </TabsContent>

          <TabsContent value="logs">
            <AdminLogsTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function AdminUsersTab() {
  return <UserManagement />;
}

function AdminKycTab() {
  return <KycManagement />;
}

function AdminTransactionsTab() {
  return <TransactionManagement />;
}

function AdminCardsTab() {
  return <VirtualCardManagement />;
}

function AdminWhatsAppTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Messaging & Configuration
          </CardTitle>
          <CardDescription>
            Manage WhatsApp conversations with customers and configure Meta Business Account
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration & Webhook Setup</CardTitle>
            <CardDescription>
              Go to Settings tab → WhatsApp section to configure your Meta Business Account credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">Webhook Information</p>
              <div className="text-sm space-y-2 font-mono">
                <p><span className="font-medium">URL:</span> <code className="bg-white p-1 rounded">/api/whatsapp/webhook</code></p>
                <p><span className="font-medium">Verify Token:</span> <code className="bg-white p-1 rounded">greenpay_verify_token_2024</code></p>
              </div>
              <p className="text-xs text-blue-800 mt-3">Copy these values and enter them in Meta App Dashboard webhook settings</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsAppMessaging />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminLogsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Logs</CardTitle>
        <CardDescription>View administrative actions and security events</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500">Security logs interface coming soon...</p>
      </CardContent>
    </Card>
  );
}

function AdminSettingsTab() {
  return <AdminSettings />;
}