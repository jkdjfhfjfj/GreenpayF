import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Send, CreditCard, TrendingUp, Shield, ArrowRight } from "lucide-react";

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Send, title: "Fast Transfers", desc: "Send money instantly to Kenya" },
    { icon: CreditCard, title: "Virtual Cards", desc: "Shop online worldwide" },
    { icon: TrendingUp, title: "Best Rates", desc: "Real-time exchange rates" },
    { icon: Shield, title: "Secure", desc: "Bank-level security" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-gray-900 overflow-hidden flex items-center justify-center p-4">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-10 w-72 h-72 bg-emerald-500 rounded-full opacity-10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-10 -left-20 w-80 h-80 bg-green-500 rounded-full opacity-10 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <div className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <span className="text-white text-3xl font-bold">$</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">GreenPay</h1>
          <p className="text-emerald-200 text-sm">Send Money. Go Global.</p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 backdrop-blur-md border border-emerald-700/50 rounded-2xl p-4 hover:border-emerald-500/50 transition-all duration-300"
            >
              <feature.icon className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-emerald-200">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center text-emerald-100 text-sm mb-10 leading-relaxed"
        >
          The easiest way to send money to Africa. Fast, secure, and affordable.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="space-y-3 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/signup")}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between group"
          >
            <span>Create Account</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/login")}
            className="w-full border-2 border-emerald-500 text-emerald-300 font-semibold py-4 px-6 rounded-xl hover:bg-emerald-950/50 transition-all duration-200"
          >
            Sign In
          </motion.button>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center space-y-2"
        >
          <p className="text-emerald-300 text-xs">
            By continuing, you agree to our{" "}
            <button onClick={() => setLocation("/terms")} className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
              Terms
            </button>
            {" "}and{" "}
            <button onClick={() => setLocation("/privacy")} className="text-emerald-400 hover:text-emerald-300 font-semibold underline">
              Privacy
            </button>
          </p>
        </motion.div>

        {/* Loading Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-8 pt-6 border-t border-emerald-700/50"
        >
          <div className="bg-emerald-950/50 rounded-full h-1 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-emerald-400 text-xs mt-2 font-medium">{Math.round(progress)}%</p>
        </motion.div>
      </div>
    </div>
  );
}
