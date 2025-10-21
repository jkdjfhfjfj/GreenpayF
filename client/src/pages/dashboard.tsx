import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Notifications from "@/components/notifications";
import { Sparkles, TrendingUp, Smartphone, Send, Download, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [activeWallet, setActiveWallet] = useState<'USD' | 'KES'>('USD');
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();

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
  
  // Dual wallet balances
  const usdBalance = parseFloat(user?.balance || '0');
  const kesBalance = parseFloat(user?.kesBalance || '0');
  
  // Get the active wallet balance based on selection
  const activeBalance = activeWallet === 'USD' ? usdBalance : kesBalance;
  
  // Convert balance to other currencies using real rates for display
  const rates = (exchangeRates as any)?.rates || {};
  const balanceInNGN = rates.NGN ? (usdBalance * rates.NGN).toFixed(2) : '0.00';
  
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

  // Quick action items
  const quickActions = [
    { 
      id: "send", 
      icon: Send, 
      label: "Send Money", 
      path: "/send-money", 
      color: "from-blue-500 to-blue-600",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "receive", 
      icon: Download, 
      label: "Receive", 
      path: "/receive-money", 
      color: "from-green-500 to-green-600",
      iconColor: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "airtime", 
      icon: Smartphone, 
      label: "Buy Airtime", 
      path: "/airtime", 
      color: "from-purple-500 to-purple-600",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      disabled: false,
      requiresCard: false
    },
    { 
      id: "deposit", 
      icon: TrendingUp, 
      label: "Add Money", 
      path: "/deposit", 
      color: "from-orange-500 to-orange-600",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      disabled: false,
      requiresCard: false
    },
  ];

  // Handle action click with card requirement check
  const handleActionClick = (action: typeof quickActions[0]) => {
    if (action.disabled && action.requiresCard) {
      toast({
        title: "Virtual Card Required",
        description: "Please get a virtual card first to use this feature. Tap 'Get Card' below.",
        variant: "default",
      });
      return;
    }
    setLocation(action.path);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary via-primary to-secondary p-6 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {user?.profilePhotoUrl ? (
              <img 
                src={user.profilePhotoUrl} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover mr-3 border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3 border-2 border-white/30 shadow-lg">
                <span className="text-white font-bold text-lg">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg">Hi, {user?.fullName?.split(' ')[0] || 'John'}!</h1>
              <p className="text-xs text-white/80">Welcome back 👋</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Notifications />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              data-testid="button-dark-mode"
            >
              <span className="material-icons text-white text-xl">brightness_6</span>
            </motion.button>
          </div>
        </div>

        {/* Wallet Balance Card - Dual Wallet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl"
        >
          {/* Wallet Switcher */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex bg-white/10 rounded-lg p-1 backdrop-blur-sm">
              <button
                onClick={() => setActiveWallet('USD')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeWallet === 'USD'
                    ? 'bg-white text-primary shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setActiveWallet('KES')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeWallet === 'KES'
                    ? 'bg-white text-primary shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                KES
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBalance(!showBalance)}
              className="bg-white/10 p-2 rounded-full backdrop-blur-sm"
              data-testid="button-toggle-balance"
            >
              <span className="material-icons text-white text-lg">
                {showBalance ? "visibility" : "visibility_off"}
              </span>
            </motion.button>
          </div>

          {/* Balance Display */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/70 text-xs mb-1 flex items-center">
                {activeWallet} Balance
                {isKYCVerified && (
                  <span className="material-icons text-green-300 ml-1 text-sm">verified</span>
                )}
              </p>
              <p className="text-3xl font-bold mb-2" data-testid="text-balance">
                {showBalance 
                  ? activeWallet === 'USD' 
                    ? `$${activeBalance.toFixed(2)}`
                    : `KSh ${activeBalance.toFixed(2)}`
                  : "••••••"}
              </p>
              {/* Show other wallet balance */}
              <p className="text-white/60 text-xs">
                {activeWallet === 'USD' ? (
                  <>Other: KSh {showBalance ? kesBalance.toFixed(2) : '••••'}</>
                ) : (
                  <>Other: ${showBalance ? usdBalance.toFixed(2) : '••••'}</>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="px-4 py-6 space-y-6">
        {/* KYC and Card Status Alerts */}
        {!isKYCVerified && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <span className="material-icons text-amber-600 mr-3">warning</span>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200 text-sm">Verify Your Identity</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Complete KYC to unlock all features</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/kyc")}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              data-testid="button-verify-kyc"
            >
              Verify
            </Button>
          </motion.div>
        )}

        {!hasActiveVirtualCard && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-center justify-between"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">Get Virtual Card</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Start making transactions</p>
              </div>
            </div>
            <Button
              onClick={() => setLocation("/virtual-card")}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              data-testid="button-activate-card"
            >
              Get Card
            </Button>
          </motion.div>
        )}

        {/* Welcome Bonus Notification - shown to new users who haven't received it */}
        {!user?.hasReceivedWelcomeBonus && kesBalance === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 p-4 rounded-xl"
          >
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="font-bold text-green-900 dark:text-green-200 text-sm mb-1">🎉 Welcome Bonus Coming!</p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  You'll receive KES 10 as a welcome gift! This will be credited to your KES wallet automatically.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileTap={{ scale: action.disabled ? 1 : 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className={`${action.bgColor} p-5 rounded-2xl border border-border hover:shadow-lg transition-all ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{action.label}</p>
                    {action.disabled && action.requiresCard && (
                      <p className="text-xs text-muted-foreground mt-0.5">Card required</p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-4">Services</h2>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/virtual-card")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-virtual-card"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">credit_card</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Virtual Card</p>
                <p className={`text-xs ${cardStatus === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                  {cardStatus === 'active' ? '● Active' : '● Inactive'}
                </p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/transactions")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-transactions"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">receipt_long</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">History</p>
                <p className="text-xs text-muted-foreground">{transactions.length} records</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/exchange")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">currency_exchange</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Exchange</p>
                <p className="text-xs text-muted-foreground">Multi-currency</p>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/support")}
              className="bg-card p-5 rounded-2xl border border-border hover:shadow-lg transition-all hover:scale-105"
              data-testid="button-support"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center mb-3 shadow-md">
                <span className="material-icons text-white text-2xl leading-none">support_agent</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm mb-1">Support</p>
                <p className="text-xs text-muted-foreground">24/7 help</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border shadow-sm"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-base">Recent Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/transactions")}
                className="text-xs"
                data-testid="button-view-all-transactions"
              >
                View All
              </Button>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id || index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'bg-green-100 dark:bg-green-950/30 text-green-600'
                        : 'bg-red-100 dark:bg-red-950/30 text-red-600'
                    }`}>
                      <span className="material-icons text-lg">
                        {transaction.type === 'receive' || transaction.type === 'deposit'
                          ? 'arrow_downward'
                          : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'receive' || transaction.type === 'deposit' ? '+' : '-'}
                      ${transaction.amount}
                    </p>
                    <p className={`text-xs ${
                      transaction.status === 'completed'
                        ? 'text-green-600'
                        : transaction.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
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
