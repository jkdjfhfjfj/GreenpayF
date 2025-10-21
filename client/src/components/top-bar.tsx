import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopBar() {
  const [location, setLocation] = useLocation();
  
  // Don't show on auth pages, splash page, or admin pages
  const hideOnPaths = [
    '/', 
    '/login', 
    '/signup', 
    '/otp-verification', 
    '/kyc-verification', 
    '/virtual-card-purchase',
    '/admin',
    '/admin-login'
  ];
  
  const shouldHide = hideOnPaths.some(path => location === path || location.startsWith('/admin'));
  
  if (shouldHide) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm"
    >
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
            <span className="material-icons text-white text-lg">attach_money</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">GreenPay</h1>
        </div>
        
        {/* Support Icon */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/live-chat')}
          className="h-9 w-9 p-0"
          title="Contact Support"
        >
          <HeadphonesIcon className="h-5 w-5" />
        </Button>
      </div>
    </motion.div>
  );
}
