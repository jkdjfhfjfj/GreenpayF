import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { id: "dashboard", icon: "home", label: "Home", path: "/dashboard" },
  { id: "transactions", icon: "receipt_long", label: "History", path: "/transactions" },
  { id: "send", icon: "swap_horiz", label: "Transfer", path: "/send-money", isCenter: true },
  { id: "virtual-card", icon: "credit_card", label: "Card", path: "/virtual-card" },
  { id: "settings", icon: "person", label: "Profile", path: "/settings" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide bottom navigation in external windows and non-authenticated pages
  const isExternal = window.opener !== null || window.parent !== window;
  
  // Only show bottom navigation on authenticated pages and not in external view
  const showBottomNav = !isExternal && isAuthenticated && (
    location.startsWith('/dashboard') ||
    location.startsWith('/transactions') ||
    location.startsWith('/virtual-card') ||
    location.startsWith('/support') ||
    location.startsWith('/settings') ||
    location.startsWith('/send-money') ||
    location.startsWith('/send-amount') ||
    location.startsWith('/send-confirm') ||
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw') ||
    location.startsWith('/exchange') ||
    location.startsWith('/airtime')
  );

  if (!showBottomNav) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
      data-testid="bottom-navigation"
    >
      <div className="bg-background/80 backdrop-blur-md border-t border-border/40 pb-safe">
        <div className="flex justify-around items-end max-w-lg mx-auto px-4 py-2 relative">
          {navItems.map((item, index) => {
            const isActive = location === item.path || 
              (item.path === '/send-money' && (location.startsWith('/send-money') || location.startsWith('/send-amount') || location.startsWith('/send-confirm')));
            
            if (item.isCenter) {
              // Large center button
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  whileTap={{ scale: 0.9 }}
                  className="relative -mt-8"
                  data-testid={`nav-${item.id}`}
                >
                  <div className="relative">
                    {/* Elevated circular button with gradient */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-purple-500 to-secondary shadow-xl flex items-center justify-center relative overflow-hidden">
                      {/* Animated glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <span className="material-icons text-white text-3xl relative z-10">
                        {item.icon}
                      </span>
                    </div>
                    {/* Label below */}
                    <p className="text-xs font-medium text-foreground/70 mt-2 text-center">
                      {item.label}
                    </p>
                  </div>
                </motion.button>
              );
            }

            // Regular nav items
            return (
              <motion.button
                key={item.id}
                onClick={() => setLocation(item.path)}
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center py-2 px-3 min-w-[60px] relative"
                data-testid={`nav-${item.id}`}
              >
                <div className="relative">
                  <span 
                    className={`material-icons transition-all duration-200 ${
                      isActive 
                        ? 'text-primary text-2xl' 
                        : 'text-muted-foreground text-xl'
                    }`}
                  >
                    {item.icon}
                  </span>
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                    />
                  )}
                </div>
                <span 
                  className={`text-xs font-medium mt-1 transition-all duration-200 ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
