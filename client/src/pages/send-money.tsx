import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Send, DollarSign, Users, CheckCircle } from "lucide-react";
import { WavyHeader } from "@/components/wavy-header";

interface UserSearchResult {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export default function SendMoneyPage() {
  const [, setLocation] = useLocation();
  
  // GreenPay user transfer state
  const [greenPaySearchTerm, setGreenPaySearchTerm] = useState("");
  const [selectedGreenPayUser, setSelectedGreenPayUser] = useState<UserSearchResult | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [greenPaySearchResults, setGreenPaySearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get transactions for real-time balance calculation
  const { data: transactionData } = useQuery({
    queryKey: ["/api/transactions", user?.id],
    enabled: !!user?.id,
  });

  const transactions = (transactionData as any)?.transactions || [];
  
  // Use the actual stored balance from server (already includes all completed transactions)
  // Server maintains balance accuracy by updating it directly when transactions complete
  const realTimeBalance = parseFloat(user?.balance || '0');

  // Search GreenPay users
  const searchGreenPayUsersMutation = useMutation({
    mutationFn: async (search: string) => {
      const encodedSearch = encodeURIComponent(search);
      const url = `/api/users/search?q=${encodedSearch}`;
      console.log('[Frontend API] Calling:', url);
      const response = await apiRequest("GET", url);
      console.log('[Frontend API] Response status:', response.status);
      const data = await response.json();
      console.log('[Frontend API] Response data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('[Frontend Search Success] Found users:', data.users);
      setGreenPaySearchResults(data.users || []);
      setIsSearchingUsers(false);
    },
    onError: (error) => {
      console.error('[Frontend Search Error] Search failed:', error);
      setGreenPaySearchResults([]);
      setIsSearchingUsers(false);
    }
  });

  // Transfer money to GreenPay user
  const greenPayTransferMutation = useMutation({
    mutationFn: async (transferData: {
      fromUserId: string;
      toUserId: string;
      amount: string;
      currency: string;
      description?: string;
    }) => {
      const response = await apiRequest("POST", "/api/transfer", transferData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Successful",
        description: `$${transferAmount} sent to ${selectedGreenPayUser?.fullName} successfully!`,
      });
      
      // Reset form
      resetGreenPayForm();
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Unable to complete transfer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGreenPayUserSearch = async (term: string) => {
    console.log('[Frontend Search] User typed:', term);
    if (term.length < 2) {
      console.log('[Frontend Search] Term too short, clearing results');
      setGreenPaySearchResults([]);
      return;
    }
    
    console.log('[Frontend Search] Starting search for:', term);
    setIsSearchingUsers(true);
    searchGreenPayUsersMutation.mutate(term);
  };

  const handleGreenPayUserSelect = (selectedUser: UserSearchResult) => {
    setSelectedGreenPayUser(selectedUser);
    setGreenPaySearchResults([]);
    setGreenPaySearchTerm("");
  };

  const resetGreenPayForm = () => {
    setSelectedGreenPayUser(null);
    setTransferAmount("");
    setTransferDescription("");
    setGreenPaySearchTerm("");
    setGreenPaySearchResults([]);
  };

  const handleGreenPayTransfer = () => {
    console.log('[Frontend Transfer] Starting transfer...');
    console.log('[Frontend Transfer] Selected user:', selectedGreenPayUser);
    console.log('[Frontend Transfer] Current user ID:', user?.id);
    console.log('[Frontend Transfer] Amount:', transferAmount);
    
    if (!selectedGreenPayUser || !transferAmount || !user) {
      console.error('[Frontend Transfer] Missing data:', { selectedUser: !!selectedGreenPayUser, amount: !!transferAmount, user: !!user });
      return;
    }

    const amount = parseFloat(transferAmount);
    
    if (amount <= 0) {
      console.error('[Frontend Transfer] Invalid amount:', amount);
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (amount > realTimeBalance) {
      console.error('[Frontend Transfer] Insufficient balance:', { available: realTimeBalance, requested: amount });
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this transfer.",
        variant: "destructive",
      });
      return;
    }

    const transferPayload = {
      fromUserId: user.id,
      toUserId: selectedGreenPayUser.id,
      amount: transferAmount,
      currency: "USD",
      description: transferDescription || `Transfer to ${selectedGreenPayUser.fullName}`
    };
    
    console.log('[Frontend Transfer] Sending payload:', transferPayload);
    greenPayTransferMutation.mutate(transferPayload);
  };

  // Check if user has virtual card requirement
  if (!user?.hasVirtualCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-icons text-destructive">block</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Virtual Card Required</h2>
          <p className="text-muted-foreground mb-4">You need to purchase a virtual card before you can send money.</p>
          <Button onClick={() => setLocation("/virtual-card")}>
            Get Virtual Card
          </Button>
        </div>
      </div>
    );
  }

  const renderGreenPayTransferContent = () => {
    return (
      <div className="space-y-4">
        {/* User Search Section */}
        {!selectedGreenPayUser && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Find GreenPay User
              </CardTitle>
              <CardDescription>
                Search for a GreenPay user by email or full name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter email or full name..."
                  value={greenPaySearchTerm}
                  onChange={(e) => {
                    setGreenPaySearchTerm(e.target.value);
                    handleGreenPayUserSearch(e.target.value);
                  }}
                  className="pl-10"
                  data-testid="input-search-greenpay-user"
                />
              </div>

              {/* Search Results */}
              {isSearchingUsers && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Searching...</p>
                </div>
              )}

              {greenPaySearchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {greenPaySearchResults.map((resultUser) => (
                    <motion.div
                      key={resultUser.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGreenPayUserSelect(resultUser)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      data-testid={`greenpay-user-result-${resultUser.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {resultUser.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{resultUser.fullName}</p>
                          <p className="text-sm text-muted-foreground">{resultUser.email}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {greenPaySearchTerm.length >= 2 && !isSearchingUsers && greenPaySearchResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transfer Form */}
        {selectedGreenPayUser && (
          <div className="space-y-4">
            {/* Selected User */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Sending to
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-lg">
                        {selectedGreenPayUser.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{selectedGreenPayUser.fullName}</p>
                      <p className="text-sm text-muted-foreground">{selectedGreenPayUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGreenPayUser(null)}
                    data-testid="button-change-greenpay-user"
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Amount and Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Transfer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="greenpay-amount">Amount (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="greenpay-amount"
                      type="number"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                      data-testid="input-greenpay-amount"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: ${realTimeBalance.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greenpay-description">Description (Optional)</Label>
                  <Textarea
                    id="greenpay-description"
                    placeholder="What's this transfer for?"
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    rows={3}
                    data-testid="input-greenpay-description"
                  />
                </div>

                <Button
                  onClick={handleGreenPayTransfer}
                  disabled={!transferAmount || parseFloat(transferAmount) <= 0 || greenPayTransferMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-send-greenpay-money"
                >
                  {greenPayTransferMutation.isPending ? (
                    "Processing Transfer..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send ${transferAmount || "0.00"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-icons text-blue-600 text-sm">info</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">About GreenPay Transfers</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Transfers between GreenPay users are instant and free</p>
                  <p>• Both sender and recipient will receive notifications</p>
                  <p>• Transfers are processed immediately with real-time balance updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <WavyHeader
        
        
        size="sm"
      />

      <div className="p-6 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-white elevation-3"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-200 text-sm">Available Balance</p>
              <p className="text-3xl font-bold">${realTimeBalance.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-green-200 text-sm">GreenPay Wallet</p>
        </motion.div>

        {/* GreenPay User Transfers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Send to GreenPay Users
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Transfer money instantly to other GreenPay users - free and instant
            </p>
          </div>
          {renderGreenPayTransferContent()}
        </motion.div>
      </div>
    </div>
  );
}