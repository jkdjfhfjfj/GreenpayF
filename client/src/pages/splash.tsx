import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { Send, CreditCard, TrendingUp, Shield, ChevronRight } from "lucide-react";

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
    <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col relative overflow-hidden" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 right-10 w-96 h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-10 -left-20 w-96 h-96 bg-green-500 rounded-full opacity-10 blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>

      {/* Top Navigation Bar - Wavy Design */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        {/* Wavy SVG Background */}
        <svg className="w-full" viewBox="0 0 1280 130" preserveAspectRatio="none" style={{ height: '140px' }}>
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4CAF50', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#45a049', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          
          {/* Main wave fill */}
          <path
            d="M0,60 Q320,0 640,60 T1280,60 L1280,0 L0,0 Z"
            fill="#4CAF50"
          />
          
          {/* Flowing curves */}
          <path
            d="M0,80 Q320,40 640,80 T1280,80 Q960,120 640,100 Q320,80 0,100 Z"
            fill="rgba(76, 175, 80, 0.4)"
            opacity="0.6"
          />
          
          {/* Accent curves */}
          <path
            d="M0,120 Q320,90 640,120 T1280,120"
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        </svg>

        {/* Content Overlay */}
        <div className="absolute top-0 right-6 flex items-center justify-end px-6 py-6 h-24">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="text-white hover:text-gray-200 transition-colors text-sm font-medium drop-shadow-md"
          >
            Skip
          </motion.button>
        </div>
      </motion.div>

      {/* Slide Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 overflow-hidden pt-0 mt-0">
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
            className="w-full max-w-2xl flex flex-col items-center justify-center"
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
              className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
            >
              {slide.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-gray-300 text-center text-base md:text-lg leading-relaxed max-w-xl"
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
        className="flex gap-2 justify-center py-4 relative z-10"
      >
        {slides.map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-3 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "bg-emerald-500 w-8" : "bg-gray-700 w-3"
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
        className="px-6 py-4 space-y-2 relative z-10"
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
      </motion.div>
    </div>
  );
}
