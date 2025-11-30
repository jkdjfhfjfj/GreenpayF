import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { formatNumber, getCurrencySymbol } from "@/lib/formatters";
import { generateTransactionPDF } from "@/lib/pdf-export";
import { Download, Mail, Filter, X, ChevronRight, Copy, Calendar, User, Tag, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TransactionFilter = "all" | "sent" | "received" | "pending";

interface AdvancedFilters {
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  currency?: string;
  type?: string;
}

export default function TransactionsPage() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showEmailExport, setShowEmailExport] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: transactionData, isLoading } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const transactions = (transactionData as any)?.transactions || [];

  const filteredTransactions = transactions.filter((transaction: any) => {
    // Basic filter
    let basicPass = true;
    switch (activeFilter) {
      case "sent":
        basicPass = transaction.type === "send";
        break;
      case "received":
        basicPass = transaction.type === "receive";
        break;
      case "pending":
        basicPass = transaction.status === "pending";
        break;
      default:
        basicPass = true;
    }
    
    if (!basicPass) return false;

    // Advanced filters
    if (advancedFilters.status && transaction.status !== advancedFilters.status) return false;
    if (advancedFilters.currency && transaction.currency !== advancedFilters.currency) return false;
    if (advancedFilters.type && transaction.type !== advancedFilters.type) return false;
    if (advancedFilters.minAmount && parseFloat(transaction.amount) < advancedFilters.minAmount) return false;
    if (advancedFilters.maxAmount && parseFloat(transaction.amount) > advancedFilters.maxAmount) return false;
    
    if (advancedFilters.dateFrom) {
      const txnDate = new Date(transaction.createdAt);
      const filterDate = new Date(advancedFilters.dateFrom);
      if (txnDate < filterDate) return false;
    }
    
    if (advancedFilters.dateTo) {
      const txnDate = new Date(transaction.createdAt);
      const filterDate = new Date(advancedFilters.dateTo);
      if (txnDate > filterDate) return false;
    }
    
    return true;
  });

  const exportMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/transactions/export-email", {
        email,
        transactions: filteredTransactions,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction report sent to your email!",
      });
      setShowEmailExport(false);
      setExportEmail("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send export email",
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "failed") return { icon: "close", bg: "bg-red-100", color: "text-red-600" };
    if (status === "pending") return { icon: "schedule", bg: "bg-yellow-100", color: "text-yellow-600" };
    
    switch (type) {
      case "send":
        return { icon: "arrow_upward", bg: "bg-green-100", color: "text-green-600" };
      case "receive":
        return { icon: "arrow_downward", bg: "bg-blue-100", color: "text-blue-600" };
      case "deposit":
        return { icon: "add", bg: "bg-purple-100", color: "text-purple-600" };
      case "withdraw":
        return { icon: "remove", bg: "bg-orange-100", color: "text-orange-600" };
      case "exchange":
        return { icon: "swap_horiz", bg: "bg-indigo-100", color: "text-indigo-600" };
      case "card_purchase":
        return { icon: "credit_card", bg: "bg-pink-100", color: "text-pink-600" };
      default:
        return { icon: "account_balance", bg: "bg-gray-100", color: "text-gray-600" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "pending":
      case "processing":
        return "text-yellow-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getAmountPrefix = (type: string, status: string) => {
    if (status === "failed") return "";
    return type === "send" || type === "withdraw" || type === "card_purchase" || type === "exchange" ? "-" : "+";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <motion.div className="bg-card shadow-sm p-4 elevation-1">
          <h1 className="text-lg font-semibold">Transactions</h1>
        </motion.div>
        <div className="p-6 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-3 md:p-4 elevation-1"
      >
        <div className="flex items-center justify-between mb-4 gap-2">
          <h1 className="text-lg font-semibold">Transactions</h1>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors text-xs md:text-sm"
              title="Advanced Filters"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Filters</span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmailExport(true)}
              disabled={filteredTransactions.length === 0}
              className="flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export & Send via Email"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Email</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (filteredTransactions.length > 0) {
                  generateTransactionPDF(filteredTransactions, {
                    fullName: user?.fullName,
                    email: user?.email,
                    phone: user?.phone
                  });
                }
              }}
              disabled={filteredTransactions.length === 0}
              className="flex items-center justify-center gap-1 px-2 md:px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">PDF</span>
            </motion.button>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-4 overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "sent", label: "Sent" },
            { id: "received", label: "Received" },
            { id: "pending", label: "Pending" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as TransactionFilter)}
              className={`py-2 px-2 md:px-3 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeFilter === filter.id
                  ? "bg-card text-foreground elevation-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`filter-${filter.id}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-muted p-4 rounded-lg space-y-3"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm">Advanced Filters</h3>
              <button
                onClick={() => {
                  setAdvancedFilters({});
                  setShowAdvancedFilters(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Status Filter */}
              <select
                value={advancedFilters.status || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value || undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>

              {/* Type Filter */}
              <select
                value={advancedFilters.type || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, type: e.target.value || undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              >
                <option value="">All Types</option>
                <option value="send">Sent</option>
                <option value="receive">Received</option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
                <option value="card_purchase">Card</option>
              </select>

              {/* Currency Filter */}
              <select
                value={advancedFilters.currency || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, currency: e.target.value || undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              >
                <option value="">Currency</option>
                <option value="USD">USD</option>
                <option value="KES">KES</option>
              </select>

              {/* Min Amount */}
              <input
                type="number"
                placeholder="Min"
                value={advancedFilters.minAmount || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, minAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Max Amount */}
              <input
                type="number"
                placeholder="Max"
                value={advancedFilters.maxAmount || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, maxAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              />

              {/* Date From */}
              <input
                type="date"
                value={advancedFilters.dateFrom || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value || undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              />

              {/* Date To */}
              <input
                type="date"
                value={advancedFilters.dateTo || ""}
                onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value || undefined })}
                className="px-2 py-2 text-xs md:text-sm border rounded-md bg-background"
              />

              <div className="flex items-center text-xs text-muted-foreground bg-background rounded-md px-2 py-2">
                Found: <span className="ml-1 font-semibold text-foreground">{filteredTransactions.length}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Export Modal */}
        {showEmailExport && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 p-3 md:p-4 rounded-lg mt-4 space-y-3"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">Export to Email</h3>
              <button
                onClick={() => setShowEmailExport(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={exportEmail}
                onChange={(e) => setExportEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-white"
              />
              <p className="text-xs text-muted-foreground">
                A detailed transaction report with {filteredTransactions.length} transactions will be sent to your email
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!exportEmail) {
                    toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
                    return;
                  }
                  exportMutation.mutate(exportEmail);
                }}
                disabled={exportMutation.isPending || !exportEmail}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {exportMutation.isPending ? "Sending..." : "Send"}
              </button>
              <button
                onClick={() => setShowEmailExport(false)}
                className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="p-3 md:p-6">
        {/* Monthly Summary - Separate USD and KES */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card p-3 md:p-4 rounded-xl border border-border mb-4 md:mb-6 elevation-1"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">This Month</p>
            {/* Show USD totals if any USD transactions exist */}
            {transactions.some((txn: any) => txn.currency?.toUpperCase() !== 'KES') && (
              <div className="mb-2">
                <p className="text-xl font-bold text-primary" data-testid="text-monthly-total-usd">
                  ${formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() !== 'KES').reduce((total: number, txn: any) => 
                    txn.status === 'completed' ? total + parseFloat(txn.amount) : total, 0
                  ))}
                </p>
              </div>
            )}
            {/* Show KES totals if any KES transactions exist */}
            {transactions.some((txn: any) => txn.currency?.toUpperCase() === 'KES') && (
              <div className="mb-2">
                <p className="text-xl font-bold text-primary" data-testid="text-monthly-total-kes">
                  KSh {formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() === 'KES').reduce((total: number, txn: any) => 
                    txn.status === 'completed' ? total + parseFloat(txn.amount) : total, 0
                  ))}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Sent</p>
                {transactions.some((txn: any) => txn.currency?.toUpperCase() !== 'KES' && (txn.type === 'send' || txn.type === 'withdraw' || txn.type === 'card_purchase')) && (
                  <p className="font-semibold text-destructive text-sm" data-testid="text-monthly-sent-usd">
                    ${formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() !== 'KES' && (txn.type === 'send' || txn.type === 'withdraw' || txn.type === 'card_purchase') && txn.status === 'completed')
                      .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0))}
                  </p>
                )}
                {transactions.some((txn: any) => txn.currency?.toUpperCase() === 'KES' && (txn.type === 'send' || txn.type === 'withdraw' || txn.type === 'card_purchase')) && (
                  <p className="font-semibold text-destructive text-sm" data-testid="text-monthly-sent-kes">
                    KSh {formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() === 'KES' && (txn.type === 'send' || txn.type === 'withdraw' || txn.type === 'card_purchase') && txn.status === 'completed')
                      .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0))}
                  </p>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Received</p>
                {transactions.some((txn: any) => txn.currency?.toUpperCase() !== 'KES' && (txn.type === 'receive' || txn.type === 'deposit')) && (
                  <p className="font-semibold text-primary text-sm" data-testid="text-monthly-received-usd">
                    ${formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() !== 'KES' && (txn.type === 'receive' || txn.type === 'deposit') && txn.status === 'completed')
                      .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0))}
                  </p>
                )}
                {transactions.some((txn: any) => txn.currency?.toUpperCase() === 'KES' && (txn.type === 'receive' || txn.type === 'deposit')) && (
                  <p className="font-semibold text-primary text-sm" data-testid="text-monthly-received-kes">
                    KSh {formatNumber(transactions.filter((txn: any) => txn.currency?.toUpperCase() === 'KES' && (txn.type === 'receive' || txn.type === 'deposit') && txn.status === 'completed')
                      .reduce((total: number, txn: any) => total + parseFloat(txn.amount), 0))}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-muted-foreground mb-4">receipt_long</span>
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">Start sending or receiving money to see your transaction history here.</p>
              <button
                onClick={() => setLocation('/send-money')}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Money
              </button>
            </div>
          ) : (
            filteredTransactions.map((transaction: any) => {
              const iconData = getTransactionIcon(transaction.type, transaction.status);
              const prefix = getAmountPrefix(transaction.type, transaction.status);
              const recipientName = transaction.recipientDetails?.name || 
                (transaction.type === 'deposit' ? 'Wallet Top-up' : 
                 transaction.type === 'withdraw' ? 'Bank Withdrawal' : 
                 transaction.type === 'card_purchase' ? 'Virtual Card Purchase' :
                 transaction.type === 'exchange' ? 'Currency Exchange' : 'Transaction');
              
              const transactionDate = new Date(transaction.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              });
              
              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="bg-card p-3 md:p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors elevation-1 cursor-pointer"
                  data-testid={`transaction-${transaction.id}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 md:w-12 md:h-12 ${iconData.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <span className={`material-icons text-sm md:text-base ${iconData.color}`}>{iconData.icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm md:text-base truncate" data-testid={`text-recipient-${transaction.id}`}>
                          {recipientName}
                        </p>
                        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground overflow-x-auto">
                          <span data-testid={`text-date-${transaction.id}`} className="whitespace-nowrap">
                            {transactionDate}
                          </span>
                          {transaction.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{transaction.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center justify-end gap-1 md:gap-2 mb-1">
                        <p className={`font-semibold text-sm md:text-base ${
                          transaction.status === "failed" 
                            ? "text-muted-foreground" 
                            : transaction.type === "send" || transaction.type === "withdraw" || transaction.type === "card_purchase" || transaction.type === "exchange"
                            ? "text-destructive" 
                            : "text-primary"
                        }`} data-testid={`text-amount-${transaction.id}`}>
                          {prefix}{getCurrencySymbol(transaction.currency)}{formatNumber(transaction.amount)}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                          transaction.currency?.toUpperCase() === 'KES' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {transaction.currency?.toUpperCase() || 'USD'}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1 md:gap-2">
                        {transaction.metadata?.convertedAmount && transaction.metadata?.targetCurrency && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            ≈ {transaction.metadata.targetCurrency} {formatNumber(transaction.metadata.convertedAmount)}
                          </span>
                        )}
                        <span className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedTransaction(null)}
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full md:max-w-md md:rounded-xl rounded-t-2xl p-4 md:p-6 pb-32 md:pb-6 max-h-[90vh] overflow-y-auto space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-muted-foreground hover:text-foreground p-2"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Main Amount Display */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedTransaction.type === 'send' ? 'Sent to' : selectedTransaction.type === 'receive' ? 'Received from' : 'Transaction'}
              </p>
              <p className="text-3xl font-bold text-primary">
                {getAmountPrefix(selectedTransaction.type, selectedTransaction.status)}{getCurrencySymbol(selectedTransaction.currency)}{formatNumber(selectedTransaction.amount)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedTransaction.currency?.toUpperCase() === 'KES' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {selectedTransaction.currency?.toUpperCase() || 'USD'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
                  selectedTransaction.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  selectedTransaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {selectedTransaction.status}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-3">
              {/* Recipient/Description */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <User className="h-4 w-4" />
                  {selectedTransaction.type === 'send' ? 'Recipient' : selectedTransaction.type === 'receive' ? 'Sender' : 'Type'}
                </label>
                <p className="text-base font-medium pl-6">
                  {selectedTransaction.recipientDetails?.name || 
                    (selectedTransaction.type === 'deposit' ? 'Wallet Top-up' : 
                     selectedTransaction.type === 'withdraw' ? 'Bank Withdrawal' : 
                     selectedTransaction.type === 'card_purchase' ? 'Virtual Card Purchase' :
                     selectedTransaction.type === 'exchange' ? 'Currency Exchange' : 'Transaction')}
                </p>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Calendar className="h-4 w-4" />
                  Date & Time
                </label>
                <p className="text-base font-medium pl-6">
                  {new Date(selectedTransaction.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>

              {/* Transaction ID */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Tag className="h-4 w-4" />
                  Transaction ID
                </label>
                <div className="flex items-center gap-2 pl-6">
                  <p className="text-xs font-mono text-primary break-all">{selectedTransaction.id}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTransaction.id);
                      toast({
                        title: "Copied",
                        description: "Transaction ID copied to clipboard"
                      });
                    }}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Tag className="h-4 w-4" />
                  Type
                </label>
                <p className="text-base font-medium pl-6 capitalize">{selectedTransaction.type.replace('_', ' ')}</p>
              </div>

              {/* Description if exists */}
              {selectedTransaction.description && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <Mail className="h-4 w-4" />
                    Description
                  </label>
                  <p className="text-base font-medium pl-6">{selectedTransaction.description}</p>
                </div>
              )}

              {/* Converted Amount if exists */}
              {selectedTransaction.metadata?.convertedAmount && selectedTransaction.metadata?.targetCurrency && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <DollarSign className="h-4 w-4" />
                    Converted Amount
                  </label>
                  <p className="text-base font-medium pl-6">
                    {selectedTransaction.metadata.targetCurrency} {formatNumber(selectedTransaction.metadata.convertedAmount)}
                  </p>
                </div>
              )}

              {/* Fee if exists */}
              {selectedTransaction.metadata?.fee && (
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                    <DollarSign className="h-4 w-4" />
                    Fee
                  </label>
                  <p className="text-base font-medium pl-6 text-red-600">
                    {getCurrencySymbol(selectedTransaction.currency)}{formatNumber(selectedTransaction.metadata.fee)}
                  </p>
                </div>
              )}

              {/* Status Details */}
              {selectedTransaction.status === 'failed' && selectedTransaction.metadata?.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 p-3 rounded-lg space-y-1">
                  <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
                    Error Details
                  </label>
                  <p className="text-sm text-red-700 dark:text-red-400">{selectedTransaction.metadata.errorMessage}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <button
                onClick={() => {
                  generateTransactionPDF([selectedTransaction], {
                    fullName: user?.fullName,
                    email: user?.email,
                    phone: user?.phone
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}