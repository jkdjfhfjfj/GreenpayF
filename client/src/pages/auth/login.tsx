import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [tempLoginData, setTempLoginData] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const { toast } = useToast();
  const { login } = useAuth();

  useEffect(() => {
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
    }
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresPin) {
        // PIN verification required
        setTempLoginData(data);
        setRequiresPin(true);
        setPinCode("");
      } else if (data.requiresOtp) {
        // OTP verification required
        toast({
          title: "Verification code sent",
          description: `A 6-digit code was sent via ${data.sentVia}`,
        });
        // Store user ID in localStorage for OTP verification page
        localStorage.setItem("otpUserId", data.userId);
        localStorage.setItem("otpPhone", data.phone);
        localStorage.setItem("otpSentVia", data.sentVia || "");
        localStorage.setItem("otpEmail", data.email || "");
        setLocation("/auth/otp-verification");
      } else {
        // Direct login (when messaging not configured)
        login(data.user);
        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        });
        // Use setTimeout to ensure state has updated before navigation
        setTimeout(() => {
          setLocation("/dashboard");
        }, 100);
      }
    },
    onError: (error: any) => {
      // Check for maintenance mode response
      if (error.message?.includes("maintenance")) {
        setMaintenanceMode(true);
        setMaintenanceMessage(error.message || "System is under maintenance. Please try again later.");
        return;
      }
      
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyPinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-pin", {
        userId: tempLoginData.userId,
        pin: pinCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      setRequiresPin(false);
      setPinCode("");
      setTempLoginData(null);
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "PIN verification failed",
        description: error.message || "Invalid PIN. Please try again.",
        variant: "destructive",
      });
      setPinCode("");
    },
  });

  const biometricLoginMutation = useMutation({
    mutationFn: async () => {
      if (!biometricSupported) {
        throw new Error("Your device doesn't support biometric authentication");
      }

      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        
        // Simple approach: let browser discover credentials automatically
        const assertionOptions: PublicKeyCredentialRequestOptions = {
          challenge,
          timeout: 60000,
          userVerification: "preferred",
        };

        const assertion = await navigator.credentials.get({
          publicKey: assertionOptions,
        }) as PublicKeyCredential | null;

        if (!assertion) {
          throw new Error("Biometric authentication cancelled");
        }

        const response = await apiRequest("POST", "/api/auth/biometric/login", {
          credentialId: assertion.id,
        });
        return response.json();
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.user) {
        login(data.user);
        toast({
          title: "Biometric Login Success",
          description: "Welcome back!",
        });
        setTimeout(() => {
          setLocation("/dashboard");
        }, 100);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Biometric Login Failed",
        description: error.message || "Failed to authenticate with biometric",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <WavyHeader
        
        
        size="sm"
      />
      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <span className="material-icons text-white text-2xl">attach_money</span>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your GreenPay account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="material-icons absolute left-3 top-3 text-muted-foreground">person</span>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email"
                          className="pl-12"
                          data-testid="input-email"
                        />
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">If correct, a 6-digit verification code will be sent to your registered phone via SMS and WhatsApp and Email</p>
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
                      <div className="relative">
                        <span className="material-icons absolute left-3 top-3 text-muted-foreground">lock</span>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-12 pr-12"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="material-icons absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? "visibility_off" : "visibility"}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                    data-testid="checkbox-remember"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setLocation("/auth/forgot-password")}
                  className="text-sm text-primary hover:underline"
                  data-testid="button-forgot-password"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full ripple"
                disabled={loginMutation.isPending}
                data-testid="button-signin-submit"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setLocation("/signup")}
                className="text-primary hover:underline font-medium"
                data-testid="link-signup"
              >
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <button
                onClick={() => setLocation("/terms")}
                className="text-primary hover:underline font-medium"
              >
                Terms and Conditions
              </button>
            </p>
          </div>

          {/* PIN Verification Dialog */}
          {requiresPin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setRequiresPin(false);
                setPinCode("");
                setTempLoginData(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-background p-6 rounded-lg border border-border max-w-sm w-full shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Enter PIN</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your account has PIN protection enabled. Please enter your 4-6 digit PIN to continue.
                </p>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-bold"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRequiresPin(false);
                        setPinCode("");
                        setTempLoginData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={pinCode.length < 4 || verifyPinMutation.isPending}
                      onClick={() => verifyPinMutation.mutate()}
                    >
                      {verifyPinMutation.isPending ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {biometricSupported && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                  onClick={() => biometricLoginMutation.mutate()}
                  disabled={biometricLoginMutation.isPending}
                  data-testid="button-biometric"
                >
                  <span className="material-icons text-muted-foreground mr-2">fingerprint</span>
                  <span className="text-sm font-medium">
                    {biometricLoginMutation.isPending ? "Authenticating..." : "Biometric Login"}
                  </span>
                </Button>
              </div>
            )}
            {!biometricSupported && (
              <div className="mt-6 p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Biometric login is not supported on this device
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
