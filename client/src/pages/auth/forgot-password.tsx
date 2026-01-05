import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sentVia, setSentVia] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!contact.trim()) {
      setError("Please enter your phone number or email address");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", {
        contact: contact.trim(),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store contact for the next step (reset-password)
        localStorage.setItem("resetPhone", contact.trim());
        
        setSuccess(true);
        setSentVia(data.sentVia || data.contact);
        toast({
          title: "Success",
          description: "Reset code sent! Check your phone or email.",
        });
        
        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          setLocation("/auth/reset-password");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to send reset code");
        toast({
          title: "Error",
          description: data.message || "Failed to send reset code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const message = error.message || "Failed to send reset code. Please try again.";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your phone number or email address to receive a reset code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>
                Reset code sent to {sentVia}. Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="contact" className="text-sm font-medium">
                  Phone Number or Email
                </label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="Enter phone (e.g., +254712345678) or email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your registered phone number (with country code) or email address
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !contact.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
