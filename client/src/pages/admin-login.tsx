import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Key, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  console.log("🔵 AdminLogin component rendered");
  const [, setLocation] = useLocation();
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string; recordsRestored?: any } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

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

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    console.log("🟡 Restore submit handler called", { hasFile: !!restoreFile });
    e.preventDefault();
    
    if (!restoreFile) {
      console.log("🔴 No restore file selected");
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      console.log("📤 Starting restore with file:", restoreFile.name);
      const formData = new FormData();
      formData.append("file", restoreFile);

      const response = await fetch("/api/admin/database/restore-public", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Restore response status:", response.status);
      const result = await response.json();
      console.log("📊 Restore result:", result);

      if (response.ok) {
        console.log("✅ Restore successful");
        setRestoreStatus({
          success: true,
          message: "Database restored successfully",
          recordsRestored: result.recordsRestored,
        });
        toast({
          title: "Restore Successful",
          description: "Your database has been restored from the backup",
        });
        setRestoreFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        console.log("❌ Restore failed:", result.error);
        setRestoreStatus({
          success: false,
          message: result.error || "Failed to restore database",
        });
        toast({
          title: "Restore Failed",
          description: result.error || "Failed to restore database",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Restore error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setRestoreStatus({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred during restore",
      });
      toast({
        title: "Restore Error",
        description: error instanceof Error ? error.message : "An error occurred during database restore",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

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
              <TabsTrigger value="restore">Restore Database</TabsTrigger>
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

            {/* Restore Database Tab */}
            <TabsContent value="restore" className="space-y-4 mt-4">
              {error && (
                <div className="p-4 rounded-lg flex gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Render Error
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              )}
              <form onSubmit={handleRestoreSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Select Backup File</FormLabel>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.sql,.gz"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setRestoreFile(file);
                            setRestoreStatus(null);
                          }
                        }}
                        disabled={isRestoring}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRestoring}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Click to select backup file
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Supported: JSON, SQL, or GZ files
                      </p>
                      {restoreFile && (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          Selected: {restoreFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {restoreStatus && (
                    <div
                      className={`p-4 rounded-lg flex gap-3 ${
                        restoreStatus.success
                          ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      {restoreStatus.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            restoreStatus.success
                              ? "text-green-800 dark:text-green-300"
                              : "text-red-800 dark:text-red-300"
                          }`}
                        >
                          {restoreStatus.message}
                        </p>
                        {restoreStatus.recordsRestored && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Records restored: {JSON.stringify(restoreStatus.recordsRestored).slice(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isRestoring || !restoreFile}
                  >
                    {isRestoring ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Restoring...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Restore Database
                      </div>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Restore your database from a previously exported backup file. This will replace current data with backup data.
                  </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}