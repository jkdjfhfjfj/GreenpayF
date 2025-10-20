import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import RealLiveChat from "@/components/admin/real-live-chat";

export default function AdminSupportTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Support</h2>
          <p className="text-gray-600">Real-time customer support conversations</p>
        </div>
      </div>

      {/* Real Live Chat Component */}
      <Card className="h-[600px]">
        <RealLiveChat />
      </Card>
    </div>
  );
}