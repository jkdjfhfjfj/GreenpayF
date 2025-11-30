import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Notifications from "@/components/notifications";
import { Sparkles, TrendingUp, Smartphone, Send, Download, CreditCard, Zap, DollarSign, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/formatters";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [showBalance, setShowBalance] = useState(true);
  const [showDiscountModal] = useState(false);
  const [activeWallet, setActiveWallet] = useState<'USD' | 'KES'>('USD');
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    refreshUser();
  }, []);

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

  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  const { data: loginHistoryData } = useQuery({
    queryKey: ["/api/users/login-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest("GET", `/api/users/${user.id}/login-history`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  const transactions = (transactionData as any)?.transactions || [];
  const loginHistory = (loginHistoryData as any)?.loginHistory || [];
  
  const usdBalance = parseFloat(user?.balance || '0');
  const kesBalance = parseFloat(user?.kesBalance || '0');
  const activeBalance = activeWallet === 'USD' ? usdBalance : kesBalance;
  const rates = (exchangeRates as any)?.rates || {};
  
  const isKYCVerified = user?.kycStatus === 'verified';
  const card = (cardData as any)?.card;
  const hasActiveVirtualCard = card && card.status === 'active';
  const cardStatus = hasActiveVirtualCard ? 'active' : 'inactive';
  const currentCardPrice = (settingsData as any)?.price || "60.00";

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Get country flag emoji
  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode || countryCode.length !== 2) return '';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const quickActions = [
    { 
      id: "send", 
      icon: Send, 
      label: "Send Money", 
      path: "/send-money", 
      color: "from-blue-500 to-blue-600",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "receive", 
      icon: Download, 
      label: "Receive", 
      path: "/receive-money", 
      color: "from-green-500 to-green-600",
      disabled: !hasActiveVirtualCard,
      requiresCard: true
    },
    { 
      id: "airtime", 
      icon: Smartphone, 
      label: "Buy Airtime", 
      path: "/airtime", 
      color: "from-purple-500 to-purple-600",
      disabled: false,
      requiresCard: false
    },
    { 
      id: "deposit", 
      icon: TrendingUp, 
      label: "Add Money", 
      path: "/deposit", 
      color: "from-orange-500 to-orange-600",
      disabled: false,
      requiresCard: false
    },
  ];

  const services = [
    { icon: "credit_card", label: "Virtual Card", path: "/virtual-card", color: "from-emerald-500 to-teal-600", status: cardStatus },
    { icon: "receipt_long", label: "History", path: "/transactions", color: "from-cyan-500 to-blue-600", info: `${transactions.length}` },
    { icon: "currency_exchange", label: "Exchange", path: "/exchange", color: "from-amber-500 to-orange-600", info: "Multi-currency" },
    { icon: "support_agent", label: "Support", path: "/support", color: "from-rose-500 to-pink-600", info: "24/7" },
    { icon: "health_and_safety", label: "System", path: "/status", color: "from-green-500 to-emerald-600", info: "Status" },
    { icon: "settings", label: "Settings", path: "/settings", color: "from-purple-500 to-indigo-600", info: "Preferences" },
    { icon: "account_balance_wallet", label: "Loans", path: "/loans", color: "from-green-500 to-teal-600", info: "Borrow" },
    { icon: "bolt", label: "API", path: "/api-service", color: "from-indigo-500 to-purple-600", info: "Coming" },
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 shadow-lg"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {user?.profilePhotoUrl ? (
              <img 
                src={user.profilePhotoUrl} 
                alt="Profile" 
                className="w-12 h-12 rounded-full object-cover border-2 border-white/40 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/40 shadow-md">
                <span className="text-white font-bold text-lg">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg text-white">{user?.fullName?.split(' ')[0]}👋 {user?.country ? `${user.country}` : ''}</h1>
              <p className="text-xs text-white/80">{isKYCVerified ? '✓ Verified Account' : 'Verify your account'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Notifications />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation('/live-chat')}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Support"
              data-testid="button-support"
            >
              <span className="material-icons text-white text-xl">headset_mic</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              data-testid="button-dark-mode"
            >
              <span className="material-icons text-white text-xl">brightness_6</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Balance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
            
            <div className="relative z-10 space-y-6">
              {/* Wallet Selector */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">Available Balance</p>
                  <div className="flex bg-white/20 rounded-lg p-1 w-fit backdrop-blur-sm">
                    <button
                      onClick={() => setActiveWallet('USD')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        activeWallet === 'USD'
                          ? 'bg-white text-emerald-600 shadow-lg'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      onClick={() => setActiveWallet('KES')}
                      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                        activeWallet === 'KES'
                          ? 'bg-white text-emerald-600 shadow-lg'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      KES
                    </button>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowBalance(!showBalance)}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-colors"
                  data-testid="button-toggle-balance"
                >
                  <span className="material-icons text-white text-xl">
                    {showBalance ? "visibility" : "visibility_off"}
                  </span>
                </motion.button>
              </div>

              {/* Balance Display */}
              <div>
                <p className="text-5xl font-bold font-mono mb-2" data-testid="text-balance">
                  {showBalance 
                    ? activeWallet === 'USD' 
                      ? `$${formatNumber(activeBalance)}`
                      : `KSh ${formatNumber(activeBalance)}`
                    : "••••••"}
                </p>
                <div className="flex items-center justify-between text-white/80 text-sm">
                  <span>
                    {activeWallet === 'USD' ? (
                      <>Other: KSh {showBalance ? formatNumber(kesBalance) : '••••'}</>
                    ) : (
                      <>Other: ${showBalance ? formatNumber(usdBalance) : '••••'}</>
                    )}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setLocation("/exchange")}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-medium"
                  >
                    <span className="material-icons text-lg">currency_exchange</span>
                    Exchange
                  </motion.button>
                </div>
              </div>

              {/* KYC Status */}
              {isKYCVerified && (
                <div className="flex items-center gap-2 text-green-100 text-sm">
                  <span className="material-icons text-sm">verified</span>
                  <span>Your account is verified</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Alerts Section */}
        <div className="space-y-3">
          {!isKYCVerified && user?.kycStatus === 'pending' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons text-blue-600 text-2xl">hourglass_empty</span>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Under Review</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Your documents are being verified</p>
                </div>
              </div>
              <Button onClick={() => setLocation("/kyc")} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" data-testid="button-view-kyc">View</Button>
            </motion.div>
          )}

          {!isKYCVerified && user?.kycStatus === 'rejected' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons text-red-600 text-2xl">error_outline</span>
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">Verification Failed</p>
                  <p className="text-xs text-red-700 dark:text-red-300">Please resubmit your documents</p>
                </div>
              </div>
              <Button onClick={() => setLocation("/kyc")} size="sm" className="bg-red-600 hover:bg-red-700 text-xs" data-testid="button-resubmit-kyc">Retry</Button>
            </motion.div>
          )}

          {!isKYCVerified && (!user?.kycStatus || user?.kycStatus === 'not_submitted') && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-icons text-amber-600 text-2xl">warning</span>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">Complete Verification</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">Unlock all features by verifying your identity</p>
                </div>
              </div>
              <Button onClick={() => setLocation("/kyc")} size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs" data-testid="button-verify-kyc">Verify</Button>
            </motion.div>
          )}

          {!hasActiveVirtualCard && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Get Virtual Card</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">Start making transactions today</p>
                </div>
              </div>
              <Button onClick={() => setLocation("/virtual-card")} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs" data-testid="button-activate-card">Get Card</Button>
            </motion.div>
          )}

          {!user?.hasClaimedAirtimeBonus && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-bold text-purple-900 dark:text-purple-200">🎁 Free Airtime Bonus</p>
                  <p className="text-xs text-purple-700 dark:text-purple-300">Claim KES 15 one-time bonus now</p>
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const response = await apiRequest("POST", "/api/airtime/claim-bonus", { userId: user?.id });
                    const data = await response.json();
                    if (data.success) {
                      toast({ title: "Bonus Claimed!", description: data.message });
                      await refreshUser();
                      setLocation("/airtime");
                    } else {
                      toast({ title: "Error", description: data.message, variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "Error", description: "Failed to claim bonus", variant: "destructive" });
                  }
                }}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                Claim
              </Button>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileTap={{ scale: action.disabled ? 1 : 0.95 }}
                  onClick={() => handleActionClick(action)}
                  className={`group p-4 rounded-2xl transition-all transform ${
                    action.disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-xl hover:scale-105'
                  }`}
                >
                  <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-4 mb-3 group-hover:shadow-lg transition-all w-full flex justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold text-sm text-center text-foreground">{action.label}</p>
                  {action.disabled && action.requiresCard && (
                    <p className="text-xs text-muted-foreground text-center mt-1">Card required</p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Services Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.button
                key={service.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * index }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocation(service.path)}
                className="group bg-card hover:shadow-lg transition-all p-4 rounded-2xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700"
              >
                <div className={`bg-gradient-to-br ${service.color} rounded-2xl p-3 mb-3 flex justify-center`}>
                  <span className="material-icons text-white text-2xl">{service.icon}</span>
                </div>
                <p className="font-semibold text-sm text-foreground text-center mb-1">{service.label}</p>
                {service.status && (
                  <p className={`text-xs text-center font-medium ${
                    service.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {service.status === 'active' ? '● Active' : '● Inactive'}
                  </p>
                )}
                {service.info && service.label !== 'Virtual Card' && (
                  <p className="text-xs text-muted-foreground text-center">{service.info}</p>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        {transactions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">Recent Activity</h3>
              <Button variant="ghost" onClick={() => setLocation("/transactions")} className="text-emerald-600 hover:text-emerald-700 text-sm" data-testid="button-view-all-transactions">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id || index} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                      <p className="font-medium text-sm capitalize text-foreground">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'receive' || transaction.type === 'deposit' ? '+' : '-'}
                      {transaction.currency?.toUpperCase() === 'KES' ? 'KSh ' : '$'}{transaction.amount}
                    </p>
                    <p className={`text-xs capitalize ${
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

        {/* Recent Logins */}
        {loginHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-lg text-foreground">Security & Logins</h3>
            </div>
            <div className="divide-y divide-border">
              {loginHistory.slice(0, 5).map((login: any, index: number) => (
                <div key={login.id || index} className="p-4 flex items-start justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="material-icons text-lg">
                        {login.deviceType === 'mobile' ? 'smartphone' : 'computer'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">
                        {login.browser || 'Unknown'} • {login.deviceType?.charAt(0).toUpperCase() + login.deviceType?.slice(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">{login.location || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(login.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      login.status === 'success' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}>
                      {login.status}
                    </span>
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
