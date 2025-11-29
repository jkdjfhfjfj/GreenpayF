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
import { Smartphone, Zap, Wifi, TrendingUp, Clock } from "lucide-react";

const airtimeSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[0-9+]+$/, "Invalid phone number format"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return num >= 5 && num <= 10000;
  }, "Amount must be between KSh 5 and KSh 10,000"),
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
    { label: "KSh 5", value: "5" },
    { label: "KSh 10", value: "10" },
    { label: "KSh 20", value: "20" },
    { label: "KSh 50", value: "50" },
    { label: "KSh 100", value: "100" },
    { label: "KSh 200", value: "200" },
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
    const kesBalance = parseFloat(user?.kesBalance || '0');
    const amount = parseFloat(data.amount);
    
    if (kesBalance < amount) {
      toast({
        title: "Insufficient KES Balance",
        description: "Please convert USD to KES in the Exchange page to buy airtime",
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
        className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 p-8 text-white relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

        <div className="relative z-10">
          {/* Back Button and Title */}
          <div className="flex items-center mb-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/dashboard")}
              className="mr-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <span className="material-icons">arrow_back</span>
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-full"
                >
                  <Smartphone className="w-6 h-6" />
                </motion.div>
                <h1 className="text-3xl font-bold">Buy Airtime</h1>
              </div>
              <p className="text-sm text-white/90">Instant mobile top-up for all networks</p>
            </div>
          </div>

          {/* Balance and Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Main Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl hover:bg-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-white/80 font-medium mb-2 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5" />
                    Available KES Balance
                  </p>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl font-bold"
                  >
                    KSh {parseFloat(user?.kesBalance || '0').toFixed(2)}
                  </motion.p>
                  <p className="text-xs text-white/70 mt-2">Ready to purchase airtime</p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-3 bg-white/10 rounded-full"
                >
                  <TrendingUp className="w-6 h-6 text-white/80" />
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-br from-white/15 to-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Delivery</p>
                    <p className="text-sm font-bold">Instant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">All Networks</p>
                    <p className="text-sm font-bold">3+ Providers</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
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
                    <FormLabel>Amount (KSh)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        placeholder="50" 
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="KES - Kenyan Shilling" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
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
