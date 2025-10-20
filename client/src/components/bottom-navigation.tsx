import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { id: "transactions", icon: "receipt_long", label: "Transactions", path: "/transactions" },
  { id: "virtual-card", icon: "credit_card", label: "Card", path: "/virtual-card" },
  { id: "support", icon: "support_agent", label: "Support", path: "/support" },
  { id: "settings", icon: "settings", label: "Settings", path: "/settings" },
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
    location.startsWith('/receive-money') ||
    location.startsWith('/deposit') ||
    location.startsWith('/withdraw') ||
    location.startsWith('/exchange')
  );

  if (!showBottomNav) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}
      data-testid="bottom-navigation"
    >
      <div className="bg-gradient-to-r from-card via-card/95 to-card backdrop-blur-sm border-t border-border/20 p-2 elevation-3 shadow-lg">
        <div className="flex justify-around max-w-sm mx-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => setLocation(item.path)}
                whileTap={{ 
                  scale: 0.85, 
                  y: 1,
                  transition: { type: "spring", stiffness: 500, damping: 25 }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -4,
                  transition: { type: "spring", stiffness: 400, damping: 20 }
                }}
                className={`relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 min-w-[60px] overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-primary shadow-lg backdrop-blur-sm border border-primary/20' 
                    : 'text-muted-foreground hover:text-primary hover:bg-gradient-to-br hover:from-primary/10 hover:via-primary/5 hover:to-transparent'
                }`}
                data-testid={`nav-${item.id}`}
              >
                {/* Animated background glow effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/15 to-primary/20 opacity-0"
                  whileHover={{
                    opacity: isActive ? 0.3 : 0.15,
                    scale: 1.2,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                  style={{
                    filter: 'blur(8px)',
                  }}
                />
                
                {/* Icon with enhanced animations */}
                <motion.span 
                  className={`material-icons mb-1 relative z-10 transition-all duration-300 ${
                    isActive ? 'text-lg' : 'text-base'
                  }`}
                  whileHover={{
                    rotateZ: [0, -5, 5, 0],
                    transition: { duration: 0.4, ease: "easeInOut" }
                  }}
                >
                  {item.icon}
                </motion.span>
                
                {/* Label with bounce effect */}
                <motion.span 
                  className={`text-xs font-semibold transition-all duration-300 relative z-10 ${
                    isActive ? 'opacity-100' : 'opacity-80'
                  }`}
                  whileHover={{
                    y: [-1, 0],
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                >
                  {item.label}
                </motion.span>

                {/* Active indicator with pulse */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
                  >
                    <motion.div
                      className="absolute inset-0 bg-primary rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 0.3, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
