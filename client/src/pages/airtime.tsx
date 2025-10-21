import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
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
import { Smartphone, Zap } from "lucide-react";

const airtimeSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[0-9+]+$/, "Invalid phone number format"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return num >= 0.1 && num <= 1000;
  }, "Amount must be between $0.10 and $1000"),
  currency: z.string().min(1, "Please select a currency"),
  provider: z.string().min(1, "Please select a provider"),
});

type AirtimeForm = z.infer<typeof airtimeSchema>;

export default function AirtimePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState("");

  const form = useForm<AirtimeForm>({
    resolver: zodResolver(airtimeSchema),
    defaultValues: {
      phoneNumber: "",
      amount: "",
      currency: "KES",
      provider: "",
    },
  });

  const providers = [
    { id: "safaricom", name: "Safaricom", logo: "📱", color: "from-green-500 to-green-600" },
    { id: "airtel", name: "Airtel", logo: "🔴", color: "from-red-500 to-red-600" },
    { id: "telkom", name: "Telkom", logo: "🔵", color: "from-blue-500 to-blue-600" },
  ];

  const quickAmounts = [
    { label: "KSh 50", value: "0.38", kes: "50" },
    { label: "KSh 100", value: "0.77", kes: "100" },
    { label: "KSh 200", value: "1.54", kes: "200" },
    { label: "KSh 500", value: "3.85", kes: "500" },
    { label: "KSh 1000", value: "7.69", kes: "1000" },
    { label: "KSh 2000", value: "15.38", kes: "2000" },
  ];

  const airtimeMutation = useMutation({
    mutationFn: async (data: AirtimeForm) => {
      const response = await apiRequest("POST", "/api/airtime/purchase", {
        userId: user?.id,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Airtime Purchased!",
        description: "Your airtime has been sent successfully.",
      });
      form.reset();
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Unable to purchase airtime. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AirtimeForm) => {
    if (!user?.hasVirtualCard) {
      toast({
        title: "Virtual Card Required",
        description: "Please activate your virtual card to purchase airtime",
        variant: "destructive",
      });
      return;
    }

    const balance = parseFloat(user?.balance || '0');
    const amount = parseFloat(data.amount);
    
    if (balance < amount) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your wallet",
        variant: "destructive",
      });
      return;
    }

    airtimeMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary to-secondary p-6 text-white"
      >
        <div className="flex items-center mb-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/dashboard")}
            className="mr-3"
          >
            <span className="material-icons">arrow_back</span>
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center">
              <Smartphone className="w-6 h-6 mr-2" />
              Buy Airtime
            </h1>
            <p className="text-sm text-white/80">Top up your phone instantly</p>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <p className="text-xs text-white/70">Available Balance</p>
          <p className="text-2xl font-bold">${parseFloat(user?.balance || '0').toFixed(2)}</p>
        </div>
      </motion.div>

      <div className="p-6 space-y-6">
        {/* Network Provider Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-primary" />
            Select Network
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {providers.map((provider) => (
              <motion.button
                key={provider.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedProvider(provider.id);
                  form.setValue("provider", provider.id);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedProvider === provider.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div className={`text-3xl mb-2 bg-gradient-to-br ${provider.color} bg-clip-text text-transparent`}>
                  {provider.logo}
                </div>
                <p className="text-xs font-medium">{provider.name}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Amount Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold mb-3">Quick Select</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickAmounts.map((quick) => (
              <motion.button
                key={quick.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => form.setValue("amount", quick.value)}
                className="p-3 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
              >
                <p className="text-sm font-semibold">{quick.label}</p>
                <p className="text-xs text-muted-foreground">${quick.value}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Purchase Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Purchase Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0712345678" 
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.50" 
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                disabled={airtimeMutation.isPending}
              >
                {airtimeMutation.isPending ? (
                  <>
                    <span className="material-icons animate-spin mr-2">refresh</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">smartphone</span>
                    Purchase Airtime
                  </>
                )}
              </Button>
            </form>
          </Form>
        </motion.div>

        {/* Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
        >
          <div className="flex items-start">
            <span className="material-icons text-blue-600 mr-2">info</span>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Quick & Easy</p>
              <p className="text-xs">Airtime will be delivered instantly to the number provided. Make sure the phone number and network provider are correct.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
