import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Receipt, CheckCircle, Clock } from "lucide-react";

const billPaymentSchema = z.object({
  provider: z.string().min(1, "Please select a provider"),
  meterNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return num > 0 && num <= 1000000;
  }, "Amount must be between 1 and 1,000,000"),
}).refine((data) => {
  const { provider, meterNumber, accountNumber } = data;
  const needsMeter = ["KPLC", "Kenya_Power", "Nairobi_Water"].includes(provider);
  const needsAccount = ["Zuku", "StarimesTV", "Airtel_Money"].includes(provider);
  
  if (needsMeter && !meterNumber) return false;
  if (needsAccount && !accountNumber) return false;
  return true;
}, "Please provide required identification for selected provider");

type BillPaymentForm = z.infer<typeof billPaymentSchema>;

const BILL_PROVIDERS = [
  { value: "KPLC", label: "KPLC (Electricity)", needsId: "meterNumber" },
  { value: "Zuku", label: "Zuku (Cable TV)", needsId: "accountNumber" },
  { value: "StarimesTV", label: "StarimesTV (Cable)", needsId: "accountNumber" },
  { value: "Nairobi_Water", label: "Nairobi Water", needsId: "meterNumber" },
  { value: "Kenya_Power", label: "Kenya Power", needsId: "meterNumber" },
  { value: "Airtel_Money", label: "Airtel Money", needsId: "accountNumber" },
];

interface BillPaymentRecord {
  id: string;
  provider: string;
  meterNumber?: string;
  accountNumber?: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function BillsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [billHistory, setBillHistory] = useState<BillPaymentRecord[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  const form = useForm<BillPaymentForm>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: {
      provider: "",
      meterNumber: "",
      accountNumber: "",
      amount: "",
    },
  });

  useEffect(() => {
    if (user?.id) {
      fetchBillHistory();
    }
  }, [user?.id]);

  const fetchBillHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await apiRequest("GET", `/api/bills/history/${user?.id}`);
      const data = await response.json();
      setBillHistory(data.payments || []);
    } catch (error) {
      console.error("Error fetching bill history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const billPaymentMutation = useMutation({
    mutationFn: async (data: BillPaymentForm) => {
      const response = await apiRequest("POST", "/api/bills/pay", {
        userId: user?.id,
        provider: data.provider,
        meterNumber: data.meterNumber || null,
        accountNumber: data.accountNumber || null,
        amount: data.amount,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bill Paid!",
        description: "Your bill payment has been processed successfully.",
      });
      form.reset();
      setSelectedProvider("");
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
      fetchBillHistory();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process bill payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BillPaymentForm) => {
    const kesBalance = parseFloat(user?.kesBalance || '0');
    const amount = parseFloat(data.amount);
    
    if (kesBalance < amount) {
      toast({
        title: "Insufficient KES Balance",
        description: "Please convert USD to KES in the Exchange page to pay bills",
        variant: "destructive",
      });
      return;
    }

    billPaymentMutation.mutate(data);
  };

  const selectedProviderObj = BILL_PROVIDERS.find(p => p.value === selectedProvider);
  const isLoadingSubmit = billPaymentMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 p-8 text-white relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

        <div className="relative z-10">
          {/* Back Button and Title */}
          <div className="flex items-center mb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/dashboard")}
              className="mr-3"
            >
              <span className="material-icons">arrow_back</span>
            </motion.button>
            <h1 className="text-2xl font-bold">Pay Bills</h1>
          </div>
          <p className="text-green-50 text-sm ml-12">Pay your utility and service bills instantly</p>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800"
        >
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Available KES Balance</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">KSh {parseFloat(user?.kesBalance || "0").toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </motion.div>

        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
        >
          <h2 className="text-lg font-semibold mb-6">New Bill Payment</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Provider Selection */}
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Bill Provider</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedProvider(value);
                        form.clearErrors("meterNumber");
                        form.clearErrors("accountNumber");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILL_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meter Number (for utilities) */}
              {selectedProviderObj?.needsId === "meterNumber" && (
                <FormField
                  control={form.control}
                  name="meterNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Meter Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter meter number"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Account Number (for cable/internet) */}
              {selectedProviderObj?.needsId === "accountNumber" && (
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account number"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Amount (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                        className="h-12"
                        step="0.01"
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoadingSubmit}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-base rounded-lg"
              >
                {isLoadingSubmit ? "Processing..." : "Pay Bill"}
              </Button>
            </form>
          </Form>
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Recent Payments</h2>

          {loadingHistory ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : billHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-50" />
              <p>No bill payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billHistory.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {payment.status === "completed" ? (
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <Clock size={20} className="text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {BILL_PROVIDERS.find(p => p.value === payment.provider)?.label || payment.provider}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {payment.meterNumber || payment.accountNumber || "Bill"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      KSh {parseFloat(payment.amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString('en-KE')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
