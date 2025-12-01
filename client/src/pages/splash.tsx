import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Send, CreditCard, TrendingUp, Shield } from "lucide-react";

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for authentication check to complete
    if (isLoading) return;
    
    // Auto-redirect based on authentication status
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      // Redirect unauthenticated users to login after 10 seconds
      const timer = setTimeout(() => {
        setLocation("/login");
      }, 10000); // 10 second delay

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const features = [
    { icon: Send, title: "Fast Transfers", desc: "Send money instantly" },
    { icon: CreditCard, title: "Virtual Cards", desc: "Shop worldwide" },
    { icon: TrendingUp, title: "Best Rates", desc: "Real-time rates" },
    { icon: Shield, title: "Secure", desc: "Bank-level security" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      {/* Android Phone Frame */}
      <div className="w-full max-w-sm relative">
        {/* Phone Bezel */}
        <div className="bg-black rounded-3xl p-2 shadow-2xl" style={{ aspectRatio: "9/19.5" }}>
          {/* Phone Screen - Android Safe Area */}
          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl overflow-hidden flex flex-col relative">
            
            {/* Android Status Bar */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 h-7 flex items-center justify-between px-6 text-white text-xs font-semibold">
              <span>9:41</span>
              <div className="flex gap-1">
                <span>📶</span>
                <span>📡</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Android Notch */}
            <div className="h-6 bg-black rounded-b-2xl mx-auto w-32 relative z-10"></div>

            {/* Screen Content */}
            <div className="flex-1 overflow-auto flex flex-col px-6 pt-6 pb-8 bg-gradient-to-br from-emerald-50 to-green-50">
              
              {/* Header Logo */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-2 bg-white shadow-sm rounded-full px-3 py-1.5 mb-6">
                  <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">$</span>
                  </div>
                  <span className="font-bold text-gray-800 text-sm">GreenPay</span>
                </div>
              </motion.div>

              {/* Hero Content */}
              <motion.div
                className="flex-1 flex flex-col items-center justify-center"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Main Icon */}
                <motion.div
                  variants={itemVariants}
                  className="mb-6"
                >
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Send className="w-12 h-12 text-white" />
                  </motion.div>
                </motion.div>

                {/* Main Text */}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl font-bold text-gray-900 mb-2 text-center leading-tight"
                >
                  Send Money
                </motion.h1>

                <motion.h2
                  variants={itemVariants}
                  className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3 text-center"
                >
                  Go Global
                </motion.h2>

                <motion.p
                  variants={itemVariants}
                  className="text-sm text-gray-600 text-center mb-8"
                >
                  Fast, secure, affordable transfers to Africa
                </motion.p>

                {/* Features Grid */}
                <motion.div
                  variants={containerVariants}
                  className="w-full grid grid-cols-2 gap-3 mb-8"
                >
                  {features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      className="bg-white rounded-xl p-3 shadow-sm"
                    >
                      <feature.icon className="w-6 h-6 text-emerald-600 mb-1 mx-auto" />
                      <h3 className="font-semibold text-gray-900 text-xs text-center">{feature.title}</h3>
                      <p className="text-xs text-gray-600 text-center">{feature.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={itemVariants}
                className="space-y-2.5 mt-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/login")}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                  data-testid="button-signin"
                >
                  Sign In
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation("/signup")}
                  className="w-full border-2 border-emerald-600 text-emerald-600 font-semibold py-3.5 px-4 rounded-xl hover:bg-emerald-50 transition-all duration-200 text-sm"
                  data-testid="button-signup"
                >
                  Create Account
                </motion.button>
              </motion.div>

              {/* Footer */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-gray-600 text-xs text-center mt-4 leading-tight"
              >
                By continuing, you agree to our{" "}
                <a href="/terms" className="text-emerald-600 font-semibold">Terms</a> and{" "}
                <a href="/privacy" className="text-emerald-600 font-semibold">Privacy</a>
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
