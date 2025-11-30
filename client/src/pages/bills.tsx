import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Receipt, CheckCircle, Clock, Zap } from "lucide-react";

const BILL_PROVIDERS = [
  { id: "KPLC", name: "KPLC", label: "KPLC (Electricity)", icon: "⚡", color: "from-yellow-500 to-yellow-600", needsId: "meterNumber" },
  { id: "Zuku", name: "Zuku", label: "Zuku (Cable TV)", icon: "📺", color: "from-purple-500 to-purple-600", needsId: "accountNumber" },
  { id: "StarimesTV", name: "StarimesTV", label: "StarimesTV (Cable)", icon: "📡", color: "from-orange-500 to-orange-600", needsId: "accountNumber" },
  { id: "Nairobi_Water", name: "Nairobi Water", label: "Nairobi Water", icon: "💧", color: "from-blue-500 to-blue-600", needsId: "meterNumber" },
  { id: "Kenya_Power", name: "Kenya Power", label: "Kenya Power", icon: "🔌", color: "from-red-500 to-red-600", needsId: "meterNumber" },
  { id: "Airtel_Money", name: "Airtel Money", label: "Airtel Money", icon: "💰", color: "from-red-500 to-red-700", needsId: "accountNumber" },
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
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Modal state management
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Provider, 2: Details, 3: Confirm, 4: Success
  const [selectedProvider, setSelectedProvider] = useState<typeof BILL_PROVIDERS[0] | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [showModal, setShowModal] = useState(false);

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
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bills/pay", {
        userId: user?.id,
        provider: selectedProvider?.id,
        meterNumber: selectedProvider?.needsId === "meterNumber" ? identifier : null,
        accountNumber: selectedProvider?.needsId === "accountNumber" ? identifier : null,
        amount,
      });
      return response.json();
    },
    onSuccess: () => {
      setStep(4);
      setTimeout(() => {
        toast({
          title: "Bill Paid Successfully!",
          description: "Your bill payment has been processed.",
        });
        resetModal();
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
        fetchBillHistory();
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process bill payment. Please try again.",
        variant: "destructive",
      });
      setStep(2);
    },
  });

  const resetModal = () => {
    setShowModal(false);
    setStep(1);
    setSelectedProvider(null);
    setIdentifier("");
    setAmount("");
  };

  const handleProviderSelect = (provider: typeof BILL_PROVIDERS[0]) => {
    setSelectedProvider(provider);
    setStep(2);
  };

  const handleContinue = () => {
    if (!identifier || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const kesBalance = parseFloat(user?.kesBalance || "0");
    const paymentAmount = parseFloat(amount);

    if (kesBalance < paymentAmount) {
      toast({
        title: "Insufficient KES Balance",
        description: `You need KSh ${paymentAmount.toFixed(2)}, but only have KSh ${kesBalance.toFixed(2)}. Please convert USD to KES in the Exchange page.`,
        variant: "destructive",
      });
      return;
    }

    setStep(3);
  };

  const handleConfirmPayment = () => {
    billPaymentMutation.mutate();
  };

  const kesBalance = parseFloat(user?.kesBalance || "0");
  const paymentAmount = parseFloat(amount) || 0;
  const selectedProviderObj = BILL_PROVIDERS.find(p => p.id === selectedProvider?.id);
  const idLabel = selectedProvider?.needsId === "meterNumber" ? "Meter Number" : "Account Number";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Pay Bills</h1>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Available Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800"
        >
          <p className="text-xs text-green-700 dark:text-green-300 mb-1">Available KES Balance</p>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">KSh {kesBalance.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </motion.div>

        {/* Start Payment Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => setShowModal(true)}
            className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold text-lg rounded-xl shadow-lg"
          >
            <span className="material-icons mr-2">add_circle</span>
            Start New Payment
          </Button>
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-green-600" />
            Recent Payments
          </h2>

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
              {billHistory.slice(0, 5).map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {payment.status === "completed" ? (
                      <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    ) : (
                      <Clock size={20} className="text-yellow-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {BILL_PROVIDERS.find(p => p.id === payment.provider)?.label || payment.provider}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {payment.meterNumber || payment.accountNumber || "Bill"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      KSh {parseFloat(payment.amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Multi-Step Payment Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          {/* Step 1: Provider Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Select Bill Provider</DialogTitle>
                <DialogDescription>Choose the service provider you want to pay</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {BILL_PROVIDERS.map((provider) => (
                  <motion.button
                    key={provider.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleProviderSelect(provider)}
                    className="p-4 rounded-xl border-2 border-border bg-card hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all text-center"
                  >
                    <div className="text-3xl mb-2">{provider.icon}</div>
                    <p className="text-xs font-semibold">{provider.name}</p>
                  </motion.button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={resetModal}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Step 2: Enter Details */}
          {step === 2 && selectedProvider && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>{selectedProvider.label}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Provider Info Card */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{selectedProvider.icon}</div>
                    <div>
                      <p className="text-sm font-semibold">{selectedProvider.label}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Enter your details below</p>
                    </div>
                  </div>
                </div>

                {/* Identifier Input */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">{idLabel}</label>
                  <Input
                    placeholder={`Enter ${idLabel.toLowerCase()}`}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-12"
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm font-semibold mb-2 block">Amount (KES)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 pr-12"
                      step="0.01"
                      min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600">KSh</span>
                  </div>
                </div>

                {/* Balance Check */}
                <div className={`p-3 rounded-lg text-sm ${
                  kesBalance >= paymentAmount
                    ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
                }`}>
                  <p className="font-semibold">Balance: KSh {kesBalance.toFixed(2)}</p>
                  {paymentAmount > 0 && (
                    <p className="text-xs mt-1">
                      {kesBalance >= paymentAmount
                        ? `✓ You can afford this payment`
                        : `✗ Insufficient balance. Need KSh ${(paymentAmount - kesBalance).toFixed(2)} more`}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!identifier || !amount}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && selectedProvider && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogDescription>Review your payment details</DialogDescription>
              </DialogHeader>

              <div className="space-y-3 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="font-semibold">{selectedProvider.label}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
                  <span className="text-gray-600 dark:text-gray-400">{idLabel}:</span>
                  <span className="font-semibold">{identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-bold text-lg">KSh {parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold mb-1">Processing Details</p>
                <p className="text-xs">Your payment will be deducted from your KES balance and processed instantly.</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={billPaymentMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {billPaymentMutation.isPending ? "Processing..." : "Pay Now"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </motion.div>
              
              <div>
                <DialogTitle className="text-center text-xl">Payment Successful!</DialogTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Your bill payment has been processed.</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg text-sm">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
                <p className="font-bold text-lg">KSh {parseFloat(amount).toFixed(2)}</p>
              </div>

              <Button
                onClick={resetModal}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
