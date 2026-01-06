import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatNumber } from "@/lib/formatters";
import { WavyHeader } from "@/components/wavy-header";

const depositSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => parseFloat(val) >= 10, "Minimum deposit is $10"),
  currency: z.string().min(1, "Please select a currency"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

type DepositForm = z.infer<typeof depositSchema>;

export default function DepositPage() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  // Refresh user data when deposit page loads to get latest balance
  useEffect(() => {
    refreshUser();
  }, []);

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: "",
      currency: "USD",
      paymentMethod: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (data: DepositForm) => {
      // Initialize payment with Paystack
      const response = await apiRequest("POST", "/api/deposit/initialize-payment", {
        amount: data.amount,
        currency: "USD",
        paymentMethod: data.paymentMethod,
      });
      const result = await response.json();
      
      if (result.authorizationUrl) {
        // Redirect to Paystack checkout
        window.location.href = result.authorizationUrl;
      }
      
      return result;
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DepositForm) => {
    depositMutation.mutate(data);
  };

  const paymentMethods = [
    {
      id: "mpesa",
      name: "M-Pesa",
      icon: "/attached_assets/images_(11)_1767703865189.png",
      description: "Instant mobile money deposit",
      fee: "1.5%",
    },
    {
      id: "airtel",
      name: "Airtel Money",
      icon: "/attached_assets/images_(12)_1767703865310.png",
      description: "Instant mobile money deposit",
      fee: "1.5%",
    },
    {
      id: "card",
      name: "Debit/Credit Card",
      icons: [
        "/attached_assets/images_(5)_1767703865516.jpeg", // Visa
        "/attached_assets/images_(6)_1766711928513.png", // Mastercard
        "/attached_assets/images_(7)_1766711928551.png"  // Amex
      ],
      description: "Visa, Mastercard, American Express",
      fee: "2.9% + $0.30",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: "/attached_assets/images_(9)_1767703865615.png",
      description: "Manual transfer to NCBA Loop",
      fee: "Free",
    },
  ];

  const [usdAmount, setUsdAmount] = useState("");
  const [kesAmount, setKesAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState(129);

  // Conversion logic
  useEffect(() => {
    if (usdAmount && parseFloat(usdAmount) > 0) {
      setKesAmount(parseFloat(usdAmount) * exchangeRate);
    } else {
      setKesAmount(null);
    }
  }, [usdAmount, exchangeRate]);

  // Check for payment status on redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const depositStatus = params.get('deposit');
    const error = params.get('error');

    if (depositStatus === 'success') {
      toast({
        title: "Deposit Successful",
        description: "Your account has been credited successfully.",
      });
      refreshUser();
    } else if (error) {
      toast({
        title: "Payment Failed",
        description: error === 'payment_failed' ? "The payment was declined or cancelled." : "An error occurred during payment processing.",
        variant: "destructive",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <WavyHeader size="sm" />

      <div className="p-6 space-y-6">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-xl border border-primary/20"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold text-primary" data-testid="text-current-balance">
              ${formatNumber(parseFloat(user?.balance || '0'))}
            </p>
          </div>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Amount Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-4">How much USD would you like to add?</h3>
              
              <div className="grid grid-cols-1 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-8 text-lg"
                            onChange={(e) => {
                              field.onChange(e);
                              setUsdAmount(e.target.value);
                            }}
                            data-testid="input-amount"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {kesAmount !== null && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Exchange Rate:</span>
                      <span className="text-sm font-medium">1 USD = {exchangeRate} KES</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">Approximate KES:</span>
                      <span className="text-lg font-bold text-primary">KSh {formatNumber(kesAmount)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl border border-border elevation-1"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Choose Payment Method</h3>
              </div>
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 divide-y divide-border">
                      {paymentMethods.map((method) => (
                        <motion.button
                          key={method.id}
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            field.onChange(method.id);
                            setSelectedMethod(method.id);
                          }}
                          className={`w-full p-4 flex items-center text-left transition-colors ${
                            field.value === method.id ? 'bg-primary/5 border-r-2 border-primary' : 'hover:bg-muted'
                          }`}
                          data-testid={`payment-method-${method.id}`}
                        >
                          <div className="flex items-center gap-2 mr-4">
                            {method.icons ? (
                              <div className="flex -space-x-2">
                                {method.icons.map((icon, idx) => (
                                  <div key={idx} className="w-10 h-8 bg-white border border-border rounded shadow-sm flex items-center justify-center p-1 overflow-hidden">
                                    <img src={icon} alt={`${method.name} ${idx}`} className="max-w-full max-h-full object-contain" />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-16 h-10 bg-white border border-border rounded-lg flex items-center justify-center p-1 overflow-hidden">
                                <img src={method.icon} alt={method.name} className="max-w-full max-h-full object-contain" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{method.name}</p>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                          {field.value === method.id && (
                            <span className="material-icons text-primary">check_circle</span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>

            {/* Bank Transfer Details */}
            {selectedMethod === "bank_transfer" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-xl border border-border elevation-1"
              >
                <h3 className="font-semibold mb-4">NCBA Loop Transfer Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-bold">NCBA Loop</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-bold">Greenpay LTD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-bold font-mono">1006123456</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-bold text-primary">GP-{user?.id?.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    * Please upload proof of payment in the support section after transfer.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-4 rounded-xl border border-border elevation-1"
            >
              <h3 className="font-semibold mb-3">Transaction Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USD Amount</span>
                  <span className="font-medium">${form.watch("amount") || "0.00"}</span>
                </div>
                {kesAmount !== null && (
                  <div className="flex justify-between text-primary font-semibold">
                    <span>Expected KES</span>
                    <span>KSh {formatNumber(kesAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee</span>
                  <span className="font-medium">
                    {selectedMethod === "bank_transfer" ? "Free" : 
                     selectedMethod === "card" ? "$0.30 + 2.9%" : "1.5%"}
                  </span>
                </div>
                <hr className="border-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Payable</span>
                  <span>${form.watch("amount") || "0.00"}</span>
                </div>
              </div>
            </motion.div>

            {/* Footer Attribution */}
            <div className="flex flex-col items-center justify-center space-y-2 pt-4 opacity-80">
              <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1">
                  Powered by <span className="text-primary font-bold">Paystack</span>
                </span>
                <div className="w-px h-3 bg-border" />
                <span className="flex items-center gap-1">
                  Secured by <span className="text-primary font-bold">NCBA Loop</span>
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold"
                disabled={depositMutation.isPending || !form.watch("amount")}
                data-testid="button-confirm-deposit"
              >
                {depositMutation.isPending ? "Processing..." : `Deposit $${form.watch("amount") || "0.00"}`}
              </Button>
            </motion.div>
          </form>
        </Form>
      </div>
    </div>
  );
}
