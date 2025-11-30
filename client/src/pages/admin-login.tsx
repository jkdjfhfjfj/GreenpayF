import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Key, CheckCircle2, AlertCircle, Zap, Database, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tablesExist, setTablesExist] = useState(true);
  const [checkingTables, setCheckingTables] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [tableStatus, setTableStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { toast } = useToast();

  // Check if database tables exist on component mount
  useEffect(() => {
    checkDatabaseTables();
  }, []);

  const checkDatabaseTables = async () => {
    try {
      setCheckingTables(true);
      const response = await fetch("/api/admin/database/tables-exist");
      const result = await response.json();
      setTablesExist(result.tablesExist || false);
    } catch (error) {
      console.error("Error checking tables:", error);
      setTablesExist(false);
    } finally {
      setCheckingTables(false);
    }
  };

  const handleInitializeTables = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/admin/database/init-tables", {
        method: "POST",
      });
      const result = await response.json();

      if (response.ok && result.tablesInitialized) {
        toast({
          title: "Success",
          description: "Database tables created successfully",
        });
        setTablesExist(true);
        // Refresh table status
        await handleCheckTableStatus();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to initialize database tables",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while initializing database tables",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCheckTableStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch("/api/admin/database/tables-status");
      const result = await response.json();
      setTableStatus(result);
    } catch (error) {
      console.error("Error checking table status:", error);
      toast({
        title: "Error",
        description: "Failed to check database table status",
        variant: "destructive",
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: "",
    },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast({
          title: "2FA Required",
          description: "Please enter your 2FA code",
        });
        return;
      }

      if (response.ok) {
        localStorage.setItem("adminAuth", JSON.stringify(result.admin));
        toast({
          title: "Login Successful",
          description: "Welcome to GreenPay Admin Panel",
        });
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingTables) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">GreenPay Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Checking system status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tablesExist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Database Setup Required</CardTitle>
            <CardDescription>
              Initialize the database to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                The database tables need to be created. This will set up all necessary tables for the GreenPay system to function properly.
              </p>
            </div>

            <Button
              onClick={handleInitializeTables}
              disabled={isInitializing}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              {isInitializing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Initializing Database...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Initialize Database Tables
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              This process may take a few moments. Do not close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold">GreenPay Admin</CardTitle>
          <CardDescription>
            Secure administrative access to GreenPay platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="status">Table Status</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@greenpay.com"
                            disabled={isLoading}
                            data-testid="input-admin-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            disabled={isLoading}
                            data-testid="input-admin-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {requiresTwoFactor && (
                    <FormField
                      control={form.control}
                      name="twoFactorCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            2FA Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter 6-digit code"
                              maxLength={6}
                              disabled={isLoading}
                              data-testid="input-2fa-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-admin-login"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Sign In to Admin Panel
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Test Credentials:</p>
                <p className="text-xs text-blue-500 dark:text-blue-300">
                  Email: admin@greenpay.com<br />
                  Password: Admin123!@#
                </p>
              </div>
            </TabsContent>

            {/* Table Status Tab */}
            <TabsContent value="status" className="space-y-4 mt-4">
              <div className="space-y-4">
                <Button
                  onClick={handleCheckTableStatus}
                  disabled={checkingStatus}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {checkingStatus ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Checking Tables...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Check Database Tables
                    </div>
                  )}
                </Button>

                {tableStatus && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      tableStatus.allTablesReady
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}>
                      <div className="flex gap-3">
                        {tableStatus.allTablesReady ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            tableStatus.allTablesReady
                              ? 'text-green-800 dark:text-green-300'
                              : 'text-yellow-800 dark:text-yellow-300'
                          }`}>
                            {tableStatus.allTablesReady ? 'All Tables Ready' : 'Some Tables Missing'}
                          </p>
                          <p className={`text-xs mt-1 ${
                            tableStatus.allTablesReady
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {tableStatus.totalExisting} of {tableStatus.totalExpected} tables ({tableStatus.readyPercentage}%)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Existing Tables ({tableStatus.tables.length})</h4>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {tableStatus.tables.map((table: any) => (
                          <div key={table.table_name} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                            <p className="font-mono text-gray-700 dark:text-gray-300">{table.table_name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">{table.column_count} columns</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {tableStatus.missingTables.length > 0 && (
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                          <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Missing Tables ({tableStatus.missingTables.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {tableStatus.missingTables.map((table: string) => (
                              <span key={table} className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 px-2 py-1 rounded font-mono">
                                {table}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Button
                          onClick={handleInitializeTables}
                          disabled={isInitializing}
                          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          size="lg"
                        >
                          {isInitializing ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating Tables...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Create Missing Tables
                            </div>
                          )}
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Last checked: {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
