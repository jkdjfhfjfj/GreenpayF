import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Activity, 
  DollarSign,
  CreditCard,
  Zap,
  Bell,
  Mail,
  MessageCircle,
  LifeBuoy,
  Ticket,
  Settings,
  Database,
  History,
  LogOut,
  BarChart3
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "User Management", icon: Users },
    { id: "kyc", label: "KYC Review", icon: FileCheck },
    { id: "transactions", label: "Transactions", icon: Activity },
    { id: "cards", label: "Virtual Cards", icon: CreditCard },
    { id: "card-pricing", label: "Card Pricing", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "messaging", label: "Mail Management", icon: Mail },
    { id: "whatsapp", label: "WhatsApp Messaging", icon: MessageCircle },
    { id: "live-chat", label: "Live Support", icon: LifeBuoy },
    { id: "tickets", label: "Support Tickets", icon: Ticket },
    { id: "activity", label: "Activity Logs", icon: History },
    { id: "database", label: "Database Management", icon: Database },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">GreenPay Admin</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Administrative Panel</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                isActive ? "bg-green-600 text-white" : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-red-600"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
}
