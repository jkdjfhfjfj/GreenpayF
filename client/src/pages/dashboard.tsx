import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Notifications from "@/components/notifications";
import { Sparkles, X, Menu, Bell, ArrowLeftRight, FileText, Download, Building2, Zap, Droplet, Wifi, Monitor, TrendingUp, Smartphone, Heart, MoreHorizontal, Plus } from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const { user, logout, refreshUser } = useAuth();

  // Refresh user data when dashboard loads to get latest balance
  useEffect(() => {
    refreshUser();
  }, []);

  // Get real user data
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["/api/exchange-rates", "USD"],
  });

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  // Get current card price from system settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const transactions = (transactionData as any)?.transactions || [];
  
  // Use the actual stored balance from server (already includes all completed transactions)
  // Server maintains balance accuracy by updating it directly when transactions complete
  const realTimeBalance = parseFloat(user?.balance || '0');
  
  // Convert balance to other currencies using real rates
  const rates = (exchangeRates as any)?.rates || {};
  const balanceInNGN = rates.NGN ? (realTimeBalance * rates.NGN).toFixed(2) : '0.00';
  const balanceInKES = rates.KES ? (realTimeBalance * rates.KES).toFixed(2) : '0.00';
  
  // Calculate Income and Expense from transactions
  const completedTransactions = transactions.filter((t: any) => t.status === 'completed');
  const totalIncome = completedTransactions
    .filter((t: any) => t.type === 'receive' || t.type === 'deposit')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  
  const totalExpense = completedTransactions
    .filter((t: any) => t.type === 'send' || t.type === 'withdraw')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || '0'), 0);
  
  // Check user status
  const isKYCVerified = user?.kycStatus === 'verified';
  const card = (cardData as any)?.card;
  const hasActiveVirtualCard = card && card.status === 'active';
  const cardStatus = hasActiveVirtualCard ? 'active' : 'inactive';

  // Card pricing for discount modal
  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const discountPrice = currentCardPrice;

  // Show discount modal for users without active cards on dashboard load
  useEffect(() => {
    if (!hasActiveVirtualCard && user?.id && !showDiscountModal) {
      // Check if user has already seen the discount offer
      const hasSeenOffer = localStorage.getItem(`discount_offer_seen_${user.id}`);
      
      if (!hasSeenOffer) {
        const timer = setTimeout(() => {
          setShowDiscountModal(true);
        }, 2000); // Show after 2 seconds to let dashboard fully load
        return () => clearTimeout(timer);
      }
    }
  }, [hasActiveVirtualCard, user?.id, showDiscountModal, card?.status]);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Service categories
  const services = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: 'text-yellow-600' },
    { id: 'water', name: 'Water', icon: Droplet, color: 'text-blue-600' },
    { id: 'internet', name: 'Internet', icon: Wifi, color: 'text-purple-600' },
    { id: 'television', name: 'Television', icon: Monitor, color: 'text-pink-600' },
    { id: 'investment', name: 'Investment', icon: TrendingUp, color: 'text-green-600' },
    { id: 'mobile', name: 'Mobile', icon: Smartphone, color: 'text-indigo-600' },
    { id: 'medical', name: 'Medical', icon: Heart, color: 'text-red-600' },
    { id: 'other', name: 'Other', icon: MoreHorizontal, color: 'text-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation - Simplified */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                GreenPay
              </span>
            </div>
            <Notifications />
          </div>
        </div>
      </motion.div>

      <div className="p-4 space-y-6">
        {/* KYC Status Alert */}
        {!isKYCVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl ${
              user?.kycStatus === 'pending' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`material-icons mr-2 text-sm ${
                  user?.kycStatus === 'pending' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {user?.kycStatus === 'pending' ? 'hourglass_empty' : 'warning'}
                </span>
                <div>
                  <h3 className={`font-medium text-sm ${
                    user?.kycStatus === 'pending' ? 'text-blue-800' : 'text-amber-800'
                  }`}>
                    {user?.kycStatus === 'pending' ? 'Verification Pending' : 'Verify Your Identity'}
                  </h3>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/kyc")}
                size="sm"
                className={
                  user?.kycStatus === 'pending'
                    ? 'bg-blue-600 hover:bg-blue-700 text-xs'
                    : 'bg-amber-600 hover:bg-amber-700 text-xs'
                }
                data-testid="button-verify-kyc"
              >
                {user?.kycStatus === 'pending' ? 'View' : 'Verify'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Enhanced Balance Card with Income/Expense */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 p-6 rounded-3xl text-white shadow-xl overflow-hidden"
        >
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Balance</p>
                <p className="text-3xl font-bold" data-testid="text-balance">
                  {showBalance ? `$${realTimeBalance.toFixed(2)}` : "••••••"}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBalance(!showBalance)}
                className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
                data-testid="button-toggle-balance"
              >
                <span className="material-icons text-white">
                  {showBalance ? "visibility" : "visibility_off"}
                </span>
              </motion.button>
            </div>
            
            {/* Income and Expense */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="material-icons text-sm">arrow_downward</span>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Income</p>
                  <p className="font-semibold">
                    {showBalance ? `$${totalIncome.toFixed(2)}` : "••••"}
                  </p>
                </div>
              </div>
              
              <div className="w-px h-10 bg-white/20"></div>
              
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <span className="material-icons text-sm">arrow_upward</span>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Expense</p>
                  <p className="font-semibold">
                    {showBalance ? `$${totalExpense.toFixed(2)}` : "••••"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Money Badge */}
          {!hasActiveVirtualCard && (
            <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium rotate-90 origin-right">
              + ADD MONEY
            </div>
          )}
        </motion.div>

        {/* Main Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/send-money")}
            disabled={!hasActiveVirtualCard}
            className={`flex flex-col items-center space-y-2 ${
              !hasActiveVirtualCard ? 'opacity-50' : ''
            }`}
            data-testid="button-transfer"
          >
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium">Transfer</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/transactions")}
            className="flex flex-col items-center space-y-2"
            data-testid="button-bill"
          >
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <span className="text-xs font-medium">Bill</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/receive-money")}
            disabled={!hasActiveVirtualCard}
            className={`flex flex-col items-center space-y-2 ${
              !hasActiveVirtualCard ? 'opacity-50' : ''
            }`}
            data-testid="button-request"
          >
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium">Request</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/withdraw")}
            disabled={!hasActiveVirtualCard}
            className={`flex flex-col items-center space-y-2 ${
              !hasActiveVirtualCard ? 'opacity-50' : ''
            }`}
            data-testid="button-withdraw"
          >
            <div className="bg-card p-4 rounded-2xl shadow-sm border border-border hover:shadow-md transition-all">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium">Withdraw</span>
          </motion.button>
        </motion.div>

        {/* Select Service Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Select Service</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary"
              onClick={() => setLocation("/transactions")}
            >
              See all
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <motion.button
                  key={service.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    // Could navigate to a service-specific page or show modal
                    console.log(`Selected service: ${service.name}`);
                  }}
                  className="flex flex-col items-center space-y-2"
                >
                  <div className="bg-muted/50 p-4 rounded-2xl w-full aspect-square flex items-center justify-center hover:bg-muted transition-colors">
                    <Icon className={`w-6 h-6 ${service.color}`} />
                  </div>
                  <span className="text-xs font-medium text-center">{service.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Send To Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="font-semibold text-lg">Quick send to</h3>
          
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {/* Add Contact Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/send-money")}
              className="flex flex-col items-center space-y-2 flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-primary flex items-center justify-center bg-primary/5">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium">Add</span>
            </motion.button>

            {/* Recent Recipients (from transactions) */}
            {transactions
              .filter((t: any) => t.type === 'send' && t.recipientName)
              .slice(0, 5)
              .map((transaction: any, index: number) => {
                const initials = transaction.recipientName
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase() || '?';
                
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-pink-400 to-pink-600',
                  'from-purple-400 to-purple-600',
                  'from-green-400 to-green-600',
                  'from-orange-400 to-orange-600',
                ];

                return (
                  <motion.button
                    key={transaction.id || index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocation("/send-money")}
                    className="flex flex-col items-center space-y-2 flex-shrink-0"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colors[index % colors.length]} flex items-center justify-center text-white font-semibold shadow-md`}>
                      {initials}
                    </div>
                    <span className="text-xs font-medium max-w-[64px] truncate">
                      {transaction.recipientName?.split(' ')[0] || 'User'}
                    </span>
                  </motion.button>
                );
              })}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Transaction</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => setLocation("/transactions")}
                data-testid="button-view-all-transactions"
              >
                See all
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.slice(0, 3).map((transaction: any, index: number) => {
                const isIncoming = transaction.type === 'receive' || transaction.type === 'deposit';
                const displayName = isIncoming 
                  ? transaction.senderName || transaction.type 
                  : transaction.recipientName || transaction.type;
                
                return (
                  <motion.div
                    key={transaction.id || index}
                    whileHover={{ scale: 1.01 }}
                    className="bg-card p-4 rounded-2xl border border-border hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setLocation("/transactions")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isIncoming
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <span className="material-icons text-lg">
                            {isIncoming ? 'arrow_downward' : 'arrow_upward'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {displayName.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          isIncoming ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isIncoming ? '+' : '-'}${transaction.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* 75% Discount Offer Modal */}
      <Dialog open={showDiscountModal} onOpenChange={(open) => {
        setShowDiscountModal(open);
        // Mark as seen when closed by any method
        if (!open && user?.id) {
          localStorage.setItem(`discount_offer_seen_${user.id}`, 'true');
        }
      }}>
        <DialogContent className="max-w-sm mx-auto bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border-pink-200 shadow-2xl relative overflow-hidden">
          {/* Flower decorations */}
          <div className="absolute -top-2 -right-2 text-6xl opacity-30 rotate-12">🌸</div>
          <div className="absolute -bottom-4 -left-4 text-5xl opacity-40 -rotate-12">🌺</div>
          <div className="absolute top-4 left-2 text-3xl opacity-25 rotate-45">🌼</div>
          <div className="absolute bottom-6 right-4 text-4xl opacity-30 -rotate-45">🌷</div>
          <div className="absolute top-1/2 -right-6 text-5xl opacity-20 rotate-90">🌻</div>
          
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center text-pink-800 mb-2 relative z-10">
              <Sparkles className="w-5 h-5 mr-2 text-pink-600 animate-pulse" />
              <span className="text-lg font-bold">🌟 Special Offer! 🌟</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-3 relative z-10">
            {/* Simple flashy offer */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-rose-500 rounded-lg p-4 text-white animate-pulse shadow-lg">
              <div className="text-2xl font-bold mb-1">💳 Virtual Card</div>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-lg line-through opacity-70">${originalPrice}</span>
                <span className="text-3xl font-black">${discountPrice}</span>
                <div className="bg-white/20 text-xs px-2 py-1 rounded-full font-bold">
                  75% OFF
                </div>
              </div>
              <p className="text-sm opacity-90">✨ Limited Time Only! ✨</p>
            </div>


            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowDiscountModal(false);
                  setLocation("/virtual-card");
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 rounded-xl shadow-lg"
                data-testid="button-get-discount-card"
              >
                Get Card Now - ${discountPrice} ⚡
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDiscountModal(false);
                  // Mark as seen so it doesn't show again
                  if (user?.id) {
                    localStorage.setItem(`discount_offer_seen_${user.id}`, 'true');
                  }
                }}
                className="w-full text-pink-700 hover:text-pink-800 hover:bg-pink-50"
                data-testid="button-close-discount-modal"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-pink-600/70">
              🔥 Limited time offer - Don't miss out!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
