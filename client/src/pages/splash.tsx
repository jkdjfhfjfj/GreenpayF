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
      // Redirect unauthenticated users to login after a short delay
      const timer = setTimeout(() => {
        setLocation("/login");
      }, 3000); // 3 second delay to show splash screen

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, setLocation]);

  const features = [
    { icon: Send, title: "Fast Transfers", desc: "Send money to Kenya instantly" },
    { icon: CreditCard, title: "Virtual Cards", desc: "Shop online worldwide" },
    { icon: TrendingUp, title: "Best Rates", desc: "Real-time exchange rates" },
    { icon: Shield, title: "Secure & Safe", desc: "Bank-level security" }
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full opacity-20"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-80 h-80 bg-green-200 rounded-full opacity-20"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="pt-8 px-6 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white shadow-sm rounded-full px-4 py-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">$</span>
            </div>
            <span className="font-bold text-gray-800">GreenPay</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center px-6 py-12"
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
              className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center shadow-xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Send className="w-16 h-16 text-white" />
            </motion.div>
          </motion.div>

          {/* Main Text */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 text-center leading-tight"
          >
            Send Money
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Go Global
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-gray-600 text-center mb-12 max-w-md"
          >
            The easiest way to send money to Africa. Fast, secure, and affordable.
          </motion.p>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            className="w-full max-w-2xl grid grid-cols-2 gap-4 mb-12"
          >
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <feature.icon className="w-8 h-8 text-emerald-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="w-full max-w-sm space-y-3"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/login")}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="button-signin"
            >
              Sign In
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation("/signup")}
              className="w-full border-2 border-emerald-600 text-emerald-600 font-semibold py-4 px-6 rounded-xl hover:bg-emerald-50 transition-all duration-200"
              data-testid="button-signup"
            >
              Create Account
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="p-6 text-center border-t border-gray-200"
        >
          <p className="text-gray-600 text-sm">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-emerald-600 hover:underline">Terms</a> and{" "}
            <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
