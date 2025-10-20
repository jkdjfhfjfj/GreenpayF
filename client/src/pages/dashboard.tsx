import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Notifications from "@/components/notifications";
import { Sparkles, X } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm elevation-1"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user?.profilePhotoUrl ? (
                <img 
                  src={user.profilePhotoUrl} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover mr-3 border-2 border-primary/20"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {user?.fullName?.split(' ').map(n => n[0]).join('') || 'JD'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="font-semibold text-lg">Welcome back, {user?.fullName?.split(' ')[0] || 'John'}</h1>
                <p className="text-sm text-muted-foreground">Good morning!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Notifications />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                data-testid="button-dark-mode"
              >
                <span className="material-icons text-muted-foreground">brightness_6</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* KYC Status Alert */}
        {!isKYCVerified && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${
              user?.kycStatus === 'pending' 
                ? 'bg-blue-50 border border-blue-200' 
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`material-icons mr-2 ${
                  user?.kycStatus === 'pending' ? 'text-blue-600' : 'text-amber-600'
                }`}>
                  {user?.kycStatus === 'pending' ? 'hourglass_empty' : 'warning'}
                </span>
                <div>
                  <h3 className={`font-medium ${
                    user?.kycStatus === 'pending' ? 'text-blue-800' : 'text-amber-800'
                  }`}>
                    {user?.kycStatus === 'pending' ? 'Verification Pending' : 'Verify Your Identity'}
                  </h3>
                  <p className={`text-sm ${
                    user?.kycStatus === 'pending' ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {user?.kycStatus === 'pending' 
                      ? 'Your documents are under review' 
                      : 'Complete KYC to unlock all features'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/kyc")}
                size="sm"
                className={
                  user?.kycStatus === 'pending'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }
                data-testid="button-verify-kyc"
              >
                {user?.kycStatus === 'pending' ? 'View Status' : 'Verify Now'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Card Status Alert */}
        {!hasActiveVirtualCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 p-4 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-icons text-blue-600 mr-2">credit_card</span>
                <div>
                  <h3 className="font-medium text-blue-800">Activate Virtual Card</h3>
                  <p className="text-sm text-blue-700">Purchase your virtual card to start transacting</p>
                </div>
              </div>
              <Button
                onClick={() => setLocation("/virtual-card")}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-activate-card"
              >
                Activate
              </Button>
            </div>
          </motion.div>
        )}

        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-200 text-sm flex items-center">
                Total Balance
                {isKYCVerified && (
                  <span className="material-icons text-green-100 ml-1 text-sm">verified</span>
                )}
              </p>
              <p className="text-2xl font-bold" data-testid="text-balance">
                {showBalance ? `$${realTimeBalance.toFixed(2)}` : "••••••"}
              </p>
              <p className="text-green-200 text-xs">
                ≈ ₦{showBalance ? balanceInNGN : '••••'} • KSh{showBalance ? balanceInKES : '••••'}
              </p>
              <p className="text-green-100 text-xs opacity-75">Live rates</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBalance(!showBalance)}
              className="bg-white/20 p-2 rounded-full"
              data-testid="button-toggle-balance"
            >
              <span className="material-icons text-white">
                {showBalance ? "visibility" : "visibility_off"}
              </span>
            </motion.button>
          </div>
          
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/send-money")}
              disabled={!hasActiveVirtualCard}
              className={`flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-2.5 text-center border-0 ${
                !hasActiveVirtualCard ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-testid="button-send"
            >
              <span className="material-icons block mb-1">send</span>
              <span className="text-xs">Send</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/receive-money")}
              disabled={!hasActiveVirtualCard}
              className={`flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-2.5 text-center border-0 ${
                !hasActiveVirtualCard ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              data-testid="button-receive"
            >
              <span className="material-icons block mb-1">call_received</span>
              <span className="text-xs">Receive</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/deposit")}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-2.5 text-center border-0"
              data-testid="button-deposit"
            >
              <span className="material-icons block mb-1">add</span>
              <span className="text-xs">Deposit</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/exchange")}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-2.5 text-center border-0"
              data-testid="button-exchange"
            >
              <span className="material-icons block mb-1">currency_exchange</span>
              <span className="text-xs">Exchange</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/virtual-card")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-virtual-card"
          >
            <span className="material-icons text-primary text-2xl mb-2">credit_card</span>
            <p className="font-semibold">Virtual Card</p>
            <p className={`text-xs ${cardStatus === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
              {cardStatus === 'active' ? 'Active' : 'Inactive'}
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/transactions")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-transactions"
          >
            <span className="material-icons text-secondary text-2xl mb-2">receipt_long</span>
            <p className="font-semibold">Transactions</p>
            <p className="text-xs text-muted-foreground">{transactions.length} records</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/settings")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-settings"
          >
            <span className="material-icons text-accent text-2xl mb-2">settings</span>
            <p className="font-semibold">Settings</p>
            <p className="text-xs text-muted-foreground">
              {isKYCVerified ? 'Verified' : 'Setup required'}
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/support")}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-support"
          >
            <span className="material-icons text-primary text-2xl mb-2">support_agent</span>
            <p className="font-semibold">Support</p>
            <p className="text-xs text-muted-foreground">24/7 help</p>
          </motion.button>
        </motion.div>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border elevation-1"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Recent Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/transactions")}
                data-testid="button-view-all-transactions"
              >
                View All
              </Button>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 3).map((transaction: any, index: number) => (
                <div key={transaction.id || index} className="p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      transaction.type === 'receive' || transaction.type === 'deposit'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="material-icons text-sm">
                        {transaction.type === 'receive' || transaction.type === 'deposit'
                          ? 'arrow_downward'
                          : 'arrow_upward'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{transaction.type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
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