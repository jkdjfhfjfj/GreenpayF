import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";

export default function OtpVerificationPage() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();
  const { login } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [sentVia, setSentVia] = useState<string>("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("otpUserId");
    const storedPhone = localStorage.getItem("otpPhone");
    const storedEmail = localStorage.getItem("otpEmail");
    const storedSentVia = localStorage.getItem("otpSentVia");

    if (!storedUserId) {
      toast({
        title: "Session expired",
        description: "Please login again.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    setUserId(storedUserId);
    setPhone(storedPhone || "");
    setEmail(storedEmail || "");
    setSentVia(storedSentVia || "");

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [setLocation, toast]);

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/auth/verify-otp", {
        code,
        userId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.removeItem("otpUserId");
      localStorage.removeItem("otpPhone");

      login(data.user);

      toast({
        title: "Login successful!",
        description: "You have been successfully verified and logged in.",
      });

      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    },
    onError: () => {
      toast({
        title: "Verification failed",
        description: "Invalid or expired OTP code. Please try again.",
        variant: "destructive",
      });

      setOtp(new Array(6).fill(""));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    },
  });

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length === 6) {
      verifyOtpMutation.mutate(otpCode);
    }
  };

  const resendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/resend-otp", {
        userId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "OTP Resent",
        description: data.message || "A new verification code has been sent.",
      });
    },
    onError: () => {
      toast({
        title: "Resend failed",
        description: "Failed to resend verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleResend = () => {
    resendOtpMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <WavyHeader size="sm" />

      <div className="flex-1 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="material-icons text-white text-2xl">sms</span>
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Verify Login</h2>
          <p className="text-muted-foreground mb-8">
            We've sent a 6-digit verification code to (Check Email, SMS or
            WhatsApp):
            <br />
            <strong>📱 Phone:</strong> {phone || "your phone"}
            {email && (
              <>
                <br />
                <strong>📧 Email:</strong>{" "}
{email && email.trim().length > 0 ? (
  email
) : (
  <span className="text-muted-foreground">
    Check your mailbox. Ensure you entered a correct email or contact us.
  </span>
)}
              </>
            )}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center space-x-3 mb-8">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className="w-12 h-12 text-center text-xl font-bold border border-border rounded-xl bg-input focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full ripple mb-4"
              disabled={verifyOtpMutation.isPending || otp.join("").length !== 6}
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          <p className="text-muted-foreground text-sm">
            Didn't receive a code?{" "}
            <button
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-primary hover:underline font-medium disabled:opacity-50"
            >
              {resendOtpMutation.isPending ? "Sending..." : "Resend Code"}
            </button>
          </p>

          {/* ✅ WhatsApp Support Link */}
          <p className="text-muted-foreground text-sm mt-4">
            Having OTP issues?{" "}
            <a
              href="https://wa.me/14704657028"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-600 hover:underline font-medium"
            >
              <span className="material-icons text-base">chat</span>
              Contact Support on WhatsApp (+1 470 465 7028)
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
    }
