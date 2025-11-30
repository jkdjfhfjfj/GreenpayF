import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card shadow-sm p-4 elevation-1 sticky top-0 z-40"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Page Not Found</h1>
            </div>
          </div>
          <Button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-6"
        >
          {/* Large 404 Display */}
          <div className="space-y-4">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent"
            >
              404
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold">Page Not Found</h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
            </p>
          </div>

          {/* Illustration Area */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex justify-center py-8"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
              <HelpCircle className="w-16 h-16 md:w-24 md:h-24 text-primary opacity-50" />
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center pt-8"
          >
            <Button
              onClick={() => navigate('/dashboard')}
              className="gap-2 h-11 px-6"
              size="lg"
            >
              <Home className="w-5 h-5" />
              Go to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="gap-2 h-11 px-6"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Home
            </Button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-12 border-t border-border"
          >
            <p className="text-sm font-semibold text-muted-foreground mb-4">Quick Links</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { label: 'Transactions', path: '/transactions' },
                { label: 'Send Money', path: '/send-money' },
                { label: 'Cards', path: '/cards' },
                { label: 'Settings', path: '/settings' },
              ].map((link, idx) => (
                <motion.button
                  key={link.path}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  onClick={() => navigate(link.path)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Support Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-muted-foreground pt-6"
          >
            <p>If you think this is a mistake, please contact support</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
