import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useInitializeCardPayment, useVerifyCardPayment } from "@/hooks/use-paystack";
import { apiRequest } from "@/lib/queryClient";
import { WavyHeader } from "@/components/wavy-header";

export default function VirtualCardPurchasePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, login } = useAuth();

  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'manual'>('auto'); // Default to auto (recommended)
  const initializePayment = useInitializeCardPayment();
  const verifyPayment = useVerifyCardPayment();

  // Fetch manual payment settings from API
  const { data: manualPaymentSettings } = useQuery({
    queryKey: ["/api/manual-payment-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manual-payment-settings");
      return response.json();
    },
  });

  // Listen for payment completion (in real app, use webhooks)
  useState(() => {
    const checkPaymentStatus = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const reference = urlParams.get('reference');
      const status = urlParams.get('status');
      
      if (reference && status === 'success') {
        verifyPayment.mutate(reference, {
          onSuccess: () => {
            setLocation('/dashboard');
          }
        });
      }
    };
    
    checkPaymentStatus();
  });

  const handlePurchase = () => {
    initializePayment.mutate(undefined, {
      onSuccess: (data) => {
        if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      },
      onError: (error) => {
        toast({
          title: "Payment Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20">
      <WavyHeader
        title="Get Virtual Card"
        onBack={() => setLocation("/dashboard")}
        size="sm"
      />
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Get Your Virtual Card</h1>
      </motion.div>

      <div className="flex-1 p-6 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-sm mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotateY: -30 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl mb-6 elevation-3"
          >
            <div className="bg-white/20 rounded-xl p-4 mb-4">
              <span className="material-icons text-white text-4xl">credit_card</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">GreenPay Virtual Card</h3>
            <p className="text-green-100 text-sm">Required for all transactions</p>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-4"
          >
            Almost There!
          </motion.h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            To start sending and receiving money, you need to purchase a virtual card for just $60. 
            This one-time fee unlocks all features.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-card p-4 rounded-xl border border-border mb-6 elevation-1"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Virtual Card (Annual)</span>
              <span className="text-xl font-bold text-primary">$60</span>
            </div>
            <div className="text-left space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Send money worldwide</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Receive money instantly</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>Withdraw to bank accounts</span>
              </div>
              <div className="flex items-center">
                <span className="material-icons text-green-500 text-sm mr-2">check</span>
                <span>24/7 customer support</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Choose Payment Method</h3>
              
              {/* Auto Payment Option (Recommended) */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('auto')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'auto' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'auto' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {paymentMethod === 'auto' && (
                        <span className="material-icons text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">Automatic Payment</h4>
                        <span className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Instant activation via PayHero M-Pesa STK Push
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-icons text-green-500 text-xs">bolt</span>
                        <span className="text-muted-foreground">Instant</span>
                        <span className="material-icons text-green-500 text-xs ml-2">security</span>
                        <span className="text-muted-foreground">Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Manual Payment Option */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('manual')}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'manual' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'manual' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {paymentMethod === 'manual' && (
                        <span className="material-icons text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">Manual M-Pesa Payment</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Pay via M-Pesa paybill and contact support for activation
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-icons text-amber-500 text-xs">schedule</span>
                        <span className="text-muted-foreground">Requires manual activation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Auto Payment Details & Button */}
            {paymentMethod === 'auto' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Button
                  onClick={handlePurchase}
                  className="w-full ripple"
                  disabled={initializePayment.isPending}
                  data-testid="button-purchase-card"
                >
                  {initializePayment.isPending ? "Processing..." : "Pay with M-Pesa - $60"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by PayHero
                </p>
              </motion.div>
            )}

            {/* Manual Payment Details */}
            {paymentMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-muted/50 p-4 rounded-xl border border-border text-left space-y-3"
              >
                <h4 className="font-semibold flex items-center">
                  <span className="material-icons text-primary mr-2 text-sm">payments</span>
                  Payment Instructions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Paybill Number:</span>
                    <span className="font-mono font-semibold">{manualPaymentSettings?.paybill || "247"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-mono font-semibold">{manualPaymentSettings?.account || "4664"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">KES 7,740</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="material-icons text-xs mr-1 align-middle">info</span>
                    After payment, contact support with your M-Pesa confirmation message to activate your card.
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/support')}
                  variant="outline"
                  className="w-full"
                >
                  <span className="material-icons text-sm mr-2">support_agent</span>
                  Contact Support
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
