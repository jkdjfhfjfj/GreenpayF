import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Send, CreditCard, TrendingUp, Shield, ChevronRight, X } from "lucide-react";

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Send Money Instantly",
    description: "Send money to Kenya and Africa with just a few taps. Fast, secure, and affordable.",
    icon: <Send className="w-24 h-24" />,
    gradient: "from-emerald-500 to-green-600",
  },
  {
    id: 2,
    title: "Virtual Cards",
    description: "Get instant virtual Mastercard for online shopping worldwide. No waiting.",
    icon: <CreditCard className="w-24 h-24" />,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: 3,
    title: "Best Exchange Rates",
    description: "Real-time rates with no hidden fees. Get more value for your money.",
    icon: <TrendingUp className="w-24 h-24" />,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    id: 4,
    title: "Bank-Level Security",
    description: "Your money is protected with military-grade encryption and biometric login.",
    icon: <Shield className="w-24 h-24" />,
    gradient: "from-orange-500 to-red-600",
  },
];

export default function SplashPage() {
  const [, setLocation] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setLocation("/signup");
    }
  };

  const handleSkip = () => {
    setLocation("/login");
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      {/* Status Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-3 z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <span className="text-white text-sm font-semibold">9:41</span>
          <div className="flex gap-1 text-white text-xs">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>
      </div>

      {/* Main Container - Fixed Phone-like view */}
      <div className="w-full max-w-sm h-screen max-h-screen flex flex-col bg-black overflow-hidden rounded-3xl shadow-2xl border border-gray-800 relative">
        
        {/* Top Navigation Bar */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 pt-8 pb-4 flex items-center justify-between">
          <div className="w-6" />
          <div className="text-center">
            <h1 className="text-white font-bold text-lg">GreenPay</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Slide Container */}
        <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-6 relative">
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={currentSlide}
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 },
              }}
              className="w-full flex flex-col items-center justify-center py-12"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className={`bg-gradient-to-br ${slide.gradient} p-8 rounded-3xl mb-8 text-white shadow-2xl`}
              >
                {slide.icon}
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-3xl font-bold text-white text-center mb-4"
              >
                {slide.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-gray-300 text-center text-base leading-relaxed"
              >
                {slide.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-2 justify-center py-6"
        >
          {slides.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "bg-emerald-500 w-8" : "bg-gray-700 w-2"
              }`}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </motion.div>

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-t from-gray-900 to-gray-800/50 px-6 pb-6 pt-4 space-y-3"
        >
          {/* Action Buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrev}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Back
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <span>{currentSlide === slides.length - 1 ? "Get Started" : "Next"}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Skip Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSkip}
            className="w-full text-gray-400 hover:text-white font-semibold py-3 px-4 transition-colors"
          >
            {currentSlide === slides.length - 1 ? "Already have account? Sign In" : "Skip"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
