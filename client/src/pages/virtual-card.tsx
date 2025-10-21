import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Sparkles } from "lucide-react";

export default function VirtualCardPage() {
  const [, setLocation] = useLocation();
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'manual'>('auto');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cardData } = useQuery({
    queryKey: ["/api/virtual-card", user?.id],
    enabled: !!user?.id,
  });

  // Get transactions for real-time balance calculation
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  // Get current card price from system settings
  const { data: settingsData } = useQuery({
    queryKey: ["/api/system-settings/card-price"],
  });

  // Get KES amount for manual payment
  const { data: kesAmountData } = useQuery({
    queryKey: ["/api/convert-to-kes", settingsData],
    queryFn: async () => {
      const usdAmount = (settingsData as any)?.price || "60.00";
      const response = await apiRequest("POST", "/api/convert-to-kes", { usdAmount: parseFloat(usdAmount) });
      return response.json();
    },
    enabled: !!settingsData,
  });

  // Fetch manual payment settings
  const { data: manualPaymentSettings } = useQuery({
    queryKey: ["/api/manual-payment-settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/manual-payment-settings");
      return response.json();
    },
  });

  const card = (cardData as any)?.card;
  const hasCard = user?.hasVirtualCard || !!card;
  const transactions = (transactionData as any)?.transactions || [];
  
  // Get current card price (fallback to $60.00)
  const currentCardPrice = (settingsData as any)?.price || "60.00";
  const originalPrice = "60.00";
  const discountPrice = currentCardPrice;
  
  // Use the actual stored balance from server (already includes all completed transactions)  
  // Server maintains balance accuracy by updating it directly when transactions complete
  const realTimeBalance = parseFloat(user?.balance || '0');


  const purchaseCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/virtual-card/initialize-payment", {
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // PayHero STK Push initiated successfully
        toast({
          title: "STK Push Sent!",
          description: data.message || "Check your phone and enter your M-Pesa PIN to complete the payment.",
        });
        
        // Redirect to processing page for status tracking
        setTimeout(() => {
          setLocation(`/payment-processing?reference=${data.reference}&type=virtual-card`);
        }, 2000); // Brief delay to show success message
      } else {
        throw new Error(data.message || "Unable to initialize M-Pesa payment");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to initiate card purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  const maskCardNumber = (number: string) => {
    return showCardDetails ? number : "•••• •••• •••• " + number.slice(-4);
  };

  // If user doesn't have a card, show purchase screen
  if (!hasCard) {
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
            data-testid="button-back"
          >
            arrow_back
          </motion.button>
          <h1 className="text-lg font-semibold">Virtual Card</h1>
        </motion.div>

        <div className="p-6 space-y-6">
          {/* Card Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-green-200 text-sm">GreenPay Card</p>
                <p className="text-xs text-green-200">Virtual</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-white/30 rounded"></div>
                <div className="w-5 h-5 bg-white/50 rounded-full"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-2xl font-mono tracking-wider text-green-200">
                •••• •••• •••• ••••
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-green-200 text-xs">CARDHOLDER</p>
                <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "YOUR NAME"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">EXPIRES</p>
                <p className="text-sm font-semibold">••/••</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">CVV</p>
                <p className="text-sm font-semibold">•••</p>
              </div>
            </div>
          </motion.div>

          {/* Purchase Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card p-6 rounded-xl border border-border elevation-1"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-icons text-primary text-2xl">credit_card</span>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Get Your Virtual Card</h2>
                <p className="text-muted-foreground">
                  Purchase a virtual card to unlock international transactions and online payments.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Virtual Card</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm line-through text-muted-foreground">${originalPrice}</span>
                    <span className="text-xl font-bold text-green-600">${discountPrice}</span>
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      75% OFF
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-left">
                  One-time purchase • No monthly fees • Valid for 3 years
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground text-left">
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  International online payments
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Secure transactions worldwide
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Real-time spending controls
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 text-sm mr-2">check</span>
                  Instant card generation
                </div>
              </div>

              {/* Available Payment Methods Info */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <motion.span 
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="material-icons text-blue-600 dark:text-blue-400 text-2xl"
                  >
                    payment
                  </motion.span>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Available Payment Methods in Your Country
                  </p>
                </div>
              </motion.div>

              {/* Payment Method Selection */}
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold text-sm">Choose Payment Method</h3>
                
                {/* Auto Payment Option (Recommended) */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('auto')}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'auto' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/50 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'auto' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {paymentMethod === 'auto' && (
                        <span className="material-icons text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">Automatic Payment</h4>
                        <span className="bg-green-500/10 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Instant activation via PayHero M-Pesa STK Push
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Manual Payment Option */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentMethod('manual')}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'manual' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-muted/50 hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all ${
                      paymentMethod === 'manual' ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {paymentMethod === 'manual' && (
                        <span className="material-icons text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Manual M-Pesa Payment</h4>
                      <p className="text-xs text-muted-foreground">
                        Pay via paybill and contact support
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Auto Payment Button */}
              {paymentMethod === 'auto' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={() => purchaseCardMutation.mutate()}
                    className="w-full text-lg py-3 bg-green-600 hover:bg-green-700"
                    disabled={purchaseCardMutation.isPending}
                    data-testid="button-purchase-card"
                  >
                    {purchaseCardMutation.isPending ? "Processing..." : `Pay with M-Pesa - $${discountPrice}`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment powered by PayHero
                  </p>
                </motion.div>
              )}

              {/* Manual Payment Instructions */}
              {paymentMethod === 'manual' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 p-4 rounded-xl border border-border space-y-3"
                >
                  <h4 className="font-semibold text-sm flex items-center">
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
                      <span className="font-semibold">KES {kesAmountData?.kesAmount ? Math.round(kesAmountData.kesAmount).toLocaleString() : '...'}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      <span className="material-icons text-xs mr-1 align-middle">info</span>
                      After payment, contact support with your M-Pesa confirmation to activate your card.
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
            </div>
          </motion.div>
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
        className="bg-card shadow-sm p-4 flex items-center elevation-1"
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setLocation("/dashboard")}
          className="material-icons text-muted-foreground mr-3 p-2 rounded-full hover:bg-muted transition-colors"
          data-testid="button-back"
        >
          arrow_back
        </motion.button>
        <h1 className="text-lg font-semibold">Virtual Card</h1>
        <div className="ml-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="material-icons text-muted-foreground p-2 rounded-full hover:bg-muted transition-colors"
            data-testid="button-more"
          >
            more_vert
          </motion.button>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Virtual Card Display */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateY: -15 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative"
        >
          <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-green-200 text-sm">GreenPay Card</p>
                <p className="text-xs text-green-200">Virtual</p>
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-white/30 rounded"></div>
                <div className="w-5 h-5 bg-white/50 rounded-full"></div>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-2xl font-mono tracking-wider" data-testid="text-card-number">
                {maskCardNumber(card?.cardNumber || "4567123456784567")}
              </p>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-green-200 text-xs">CARDHOLDER</p>
                <p className="text-sm font-semibold">{user?.fullName?.toUpperCase() || "JOHN DOE"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">EXPIRES</p>
                <p className="text-sm font-semibold">{card?.expiryDate || "12/27"}</p>
              </div>
              <div>
                <p className="text-green-200 text-xs">CVV</p>
                <p className="text-sm font-semibold">{showCardDetails ? (card?.cvv || "123") : "•••"}</p>
              </div>
            </div>
          </div>
          
          {/* Card Actions */}
          <div className="absolute top-4 right-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCardDetails(!showCardDetails)}
              className="bg-white/20 backdrop-blur-sm p-2 rounded-full"
              data-testid="button-toggle-card-details"
            >
              <span className="material-icons text-white text-sm">
                {showCardDetails ? "visibility_off" : "visibility"}
              </span>
            </motion.button>
          </div>

          {/* Card status badge - only show when card data is loaded */}
          <div className="absolute top-4 left-4">
            <div className={`px-2 py-1 rounded-full ${
              !card ? 'bg-gray-500' : card.status === 'active'
                ? 'bg-green-500' 
                : card.status === 'frozen'
                ? 'bg-orange-500'
                : card.status === 'expired'
                ? 'bg-gray-500'
                : 'bg-red-500'
            }`}>
              <span className="text-xs font-semibold text-white">
                {!card ? 'LOADING...' : card.status === 'active' ? 'ACTIVE' : card.status === 'frozen' ? 'FROZEN' : card.status === 'expired' ? 'EXPIRED' : 'BLOCKED'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card Balance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl border border-border elevation-1"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-bold text-primary" data-testid="text-card-balance">
              ${realTimeBalance.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">Last updated: Just now</p>
          </div>
        </motion.div>

        {/* Card Blocked Warning - only show when card data is loaded and card is inactive */}
        {card && card.status !== 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl ${
              card.status === 'frozen' 
                ? 'bg-orange-50 border border-orange-200' 
                : card.status === 'expired'
                ? 'bg-gray-50 border border-gray-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center">
              <span className={`material-icons mr-3 ${
                card.status === 'frozen' ? 'text-orange-500' : card.status === 'expired' ? 'text-gray-500' : 'text-red-500'
              }`}>{card.status === 'frozen' ? 'pause_circle_filled' : card.status === 'expired' ? 'schedule' : 'block'}</span>
              <div>
                <h3 className={`font-semibold ${
                  card.status === 'frozen' ? 'text-orange-700' : card.status === 'expired' ? 'text-gray-700' : 'text-red-700'
                }`}>{card.status === 'frozen' ? 'Card Frozen' : card.status === 'expired' ? 'Card Expired' : 'Card Blocked'}</h3>
                <p className={`text-sm ${
                  card.status === 'frozen' ? 'text-orange-600' : card.status === 'expired' ? 'text-gray-600' : 'text-red-600'
                }`}>{
                  card.status === 'frozen' 
                    ? 'Your virtual card has been frozen by an administrator. Please contact support for assistance.'
                    : card.status === 'expired'
                    ? 'Your virtual card has expired and can no longer be used. Purchase a new card to continue making transactions.'
                    : 'Your virtual card has been blocked by an administrator. Please contact support for assistance.'
                }</p>
              </div>
            </div>
            {card.status === 'expired' && (
              <div className="mt-3">
                <Button
                  onClick={() => purchaseCardMutation.mutate()}
                  disabled={purchaseCardMutation.isPending}
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                  data-testid="button-purchase-new-card"
                >
                  {purchaseCardMutation.isPending ? "Processing..." : "Purchase New Card"}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={card && card.status === 'active' ? { scale: 1.02 } : {}}
            whileTap={card && card.status === 'active' ? { scale: 0.98 } : {}}
            onClick={() => {
              if (!card) return; // Still loading
              if (card.status === 'active') {
                setLocation("/deposit");
              } else {
                const statusMap = {
                  frozen: { title: "Card Frozen", desc: "frozen" },
                  expired: { title: "Card Expired", desc: "expired. Purchase a new card to continue" },
                  default: { title: "Card Blocked", desc: "blocked" }
                };
                const status = statusMap[card.status as keyof typeof statusMap] || statusMap.default;
                toast({
                  title: status.title,
                  description: `Cannot top up - your card has been ${status.desc}. Please contact support.`,
                  variant: "destructive",
                });
              }
            }}
            className={`bg-card p-4 rounded-xl border border-border text-center transition-colors elevation-1 ${
              !card ? 'opacity-30 cursor-wait' : card.status === 'active'
                ? 'hover:bg-muted cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            data-testid="button-top-up"
          >
            <span className={`material-icons text-2xl mb-2 ${!card ? 'text-gray-400' : card.status === 'active' ? 'text-primary' : 'text-gray-400'}`}>add</span>
            <p className="font-semibold">Top Up</p>
            <p className="text-xs text-muted-foreground">Add money to card</p>
          </motion.button>

          <motion.button
            whileHover={card && card.status === 'active' ? { scale: 1.02 } : {}}
            whileTap={card && card.status === 'active' ? { scale: 0.98 } : {}}
            onClick={() => {
              if (!card) return; // Still loading
              if (card.status === 'active') {
                setLocation("/withdraw");
              } else {
                const statusMap = {
                  frozen: { title: "Card Frozen", desc: "frozen" },
                  expired: { title: "Card Expired", desc: "expired. Purchase a new card to continue" },
                  default: { title: "Card Blocked", desc: "blocked" }
                };
                const status = statusMap[card.status as keyof typeof statusMap] || statusMap.default;
                toast({
                  title: status.title,
                  description: `Cannot withdraw - your card has been ${status.desc}. Please contact support.`,
                  variant: "destructive",
                });
              }
            }}
            className={`bg-card p-4 rounded-xl border border-border text-center transition-colors elevation-1 ${
              !card ? 'opacity-30 cursor-wait' : card.status === 'active'
                ? 'hover:bg-muted cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            data-testid="button-withdraw"
          >
            <span className={`material-icons text-2xl mb-2 ${!card ? 'text-gray-400' : card.status === 'active' ? 'text-secondary' : 'text-gray-400'}`}>remove</span>
            <p className="font-semibold">Withdraw</p>
            <p className="text-xs text-muted-foreground">Transfer to bank</p>
          </motion.button>

          <motion.button
            whileHover={card && card.status === 'active' ? { scale: 1.02 } : {}}
            whileTap={card && card.status === 'active' ? { scale: 0.98 } : {}}
            onClick={() => {
              if (!card) return; // Still loading
              if (card.status === 'active') {
                // Show freeze confirmation
                toast({
                  title: "Freeze Card Feature",
                  description: "Card freeze functionality will be implemented in a future update.",
                });
              } else if (card.status === 'expired') {
                toast({
                  title: "Cannot Freeze Expired Card",
                  description: "Your card has expired. Purchase a new card to continue using our services.",
                  variant: "destructive",
                });
              } else {
                const statusMap = {
                  frozen: { title: "Card Already Frozen", status: "frozen" },
                  default: { title: "Card Already Blocked", status: "blocked" }
                };
                const status = statusMap[card.status as keyof typeof statusMap] || statusMap.default;
                toast({
                  title: status.title,
                  description: `Your card is already ${status.status}. Please contact support for assistance.`,
                  variant: "destructive",
                });
              }
            }}
            className={`bg-card p-4 rounded-xl border border-border text-center transition-colors elevation-1 ${
              !card ? 'opacity-30 cursor-wait' : card.status === 'active'
                ? 'hover:bg-muted cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            data-testid="button-freeze-card"
          >
            <span className={`material-icons text-2xl mb-2 ${!card ? 'text-gray-400' : card.status === 'active' ? 'text-orange-500' : 'text-gray-400'}`}>lock</span>
            <p className="font-semibold">Freeze Card</p>
            <p className="text-xs text-muted-foreground">Temporarily disable</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-card p-4 rounded-xl border border-border text-center hover:bg-muted transition-colors elevation-1"
            data-testid="button-card-settings"
          >
            <span className="material-icons text-muted-foreground text-2xl mb-2">settings</span>
            <p className="font-semibold">Settings</p>
            <p className="text-xs text-muted-foreground">Manage card</p>
          </motion.button>
        </motion.div>

        {/* Card Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border elevation-1"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Card Information</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Card Status</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                !card ? 'bg-gray-100 text-gray-600' : card.status === 'active'
                  ? 'bg-green-100 text-green-600' 
                  : card.status === 'frozen'
                  ? 'bg-orange-100 text-orange-600'
                  : card.status === 'expired'
                  ? 'bg-gray-100 text-gray-600'
                  : 'bg-red-100 text-red-600'
              }`}>
                {!card ? 'Loading...' : card.status === 'active' ? 'Active' : card.status === 'frozen' ? 'Frozen' : card.status === 'expired' ? 'Expired' : 'Blocked'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Daily Limit</span>
              <span className="font-medium">$4,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Limit</span>
              <span className="font-medium">$50,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Issue Date</span>
              <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}