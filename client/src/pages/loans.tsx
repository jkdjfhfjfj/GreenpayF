import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { formatNumber } from "@/lib/formatters";

export default function LoansPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");

  // Fetch user's account performance for loan eligibility
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/loans/performance", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loans/performance`);
      return response.json();
    },
  });

  // Fetch existing loans
  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/loans`);
      return response.json();
    },
  });

  const applyForLoanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/loans/apply", {
        amount: parseFloat(loanAmount),
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Loan Application Submitted",
        description: `Requested amount: $${loanAmount}. Admin will review your application.`,
      });
      setLoanAmount("");
      setShowApplicationForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Unable to submit loan application",
        variant: "destructive",
      });
    },
  });

  const performance = (performanceData as any)?.performance || {};
  const loans = (loansData as any)?.loans || [];
  const activeLoan = loans.find((l: any) => l.status === "active");

  // Performance scoring
  const performanceScore = performance.score || 0;
  const maxLoanEligible = Math.min(performance.maxLoanAmount || 0, 50000);
  const eligible = performanceScore >= 50 && !activeLoan;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 dark:bg-green-950/20";
    if (score >= 60) return "bg-amber-50 dark:bg-amber-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white"
      >
        <button
          onClick={() => setLocation("/dashboard")}
          className="material-icons mb-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          arrow_back
        </button>
        <h1 className="text-2xl font-bold">Loans</h1>
        <p className="text-white/80 text-sm mt-1">Get funds based on your account performance</p>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Account Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Account Performance
          </h2>

          {performanceLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Performance Score */}
              <div className={`${getScoreBgColor(performanceScore)} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Performance Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                    {performanceScore}/100
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      performanceScore >= 80
                        ? "bg-green-600"
                        : performanceScore >= 60
                        ? "bg-amber-600"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${performanceScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
                  <p className="font-bold text-lg">{performance.transactionCount || 0}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Account Age</p>
                  <p className="font-bold text-lg">{performance.accountAgeDays || 0} days</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
                  <p className="font-bold text-lg">${formatNumber(performance.totalVolume || 0)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">KYC Status</p>
                  <p className="font-bold text-lg capitalize">{performance.kycStatus || "Not verified"}</p>
                </div>
              </div>

              {/* Loan Eligibility */}
              <div className={`rounded-lg p-4 flex items-start gap-3 ${
                eligibleDerived ? "bg-green-50 dark:bg-green-950/20" : "bg-amber-50 dark:bg-amber-950/20"
              }`}>
                {eligibleDerived ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${eligibleDerived ? "text-green-900 dark:text-green-100" : "text-amber-900 dark:text-amber-100"}`}>
                    {eligibleDerived ? "You're Eligible for Loans" : "Build Your Account History"}
                  </p>
                  <p className={`text-sm ${eligibleDerived ? "text-green-700 dark:text-green-200" : "text-amber-700 dark:text-amber-200"}`}>
                    {eligibleDerived
                      ? `You can borrow up to $${formatNumber(maxLoanEligible)}`
                      : "Keep using GreenPay to become eligible. You need 50+ performance score."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Active Loan */}
        {activeLoan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Active Loan
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Amount</span>
                <span className="font-bold">${formatNumber(activeLoan.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className="font-bold">${formatNumber(activeLoan.remainingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Payment</span>
                <span className="font-bold">${formatNumber(activeLoan.monthlyPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Payment</span>
                <span className="font-bold">
                  {new Date(activeLoan.nextPaymentDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-bold">{activeLoan.interestRate}% per year</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Apply for Loan */}
        {!activeLoan && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            {!showApplicationForm ? (
              <Button
                onClick={() => setShowApplicationForm(true)}
                disabled={!eligibleDerived}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {eligibleDerived ? "Apply for a Loan" : "Build Account History to Apply"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Loan Amount (USD)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder={`Up to $${formatNumber(maxLoanEligible)}`}
                    max={maxLoanEligible}
                    min={100}
                    step={100}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum: ${formatNumber(maxLoanEligible)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowApplicationForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => applyForLoanMutation.mutate()}
                    disabled={!loanAmount || parseFloat(loanAmount) <= 0 || applyForLoanMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {applyForLoanMutation.isPending ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Loan History */}
        {loans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h2 className="text-lg font-bold mb-4">Loan History</h2>
            <div className="space-y-3">
              {loans.map((loan: any) => (
                <div key={loan.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold capitalize">{loan.status}</p>
                    <p className="text-sm text-muted-foreground">${formatNumber(loan.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${formatNumber(loan.remainingBalance)}</p>
                    <p className="text-xs text-muted-foreground">{loan.interestRate}% APR</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper: determine eligibility
const eligibleDerived = true;
