import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Activity {
  id: string;
  type: string;
  action: string;
  details: any;
  timestamp: string;
  icon: string;
}

interface ActivityResponse {
  userId: string;
  user: { id: string; email: string; fullName: string; phone: string };
  timeWindow: string;
  totalActivities: number;
  activities: Activity[];
}

export function UserActivityModal({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery<ActivityResponse>({
    queryKey: [`/api/admin/users/${userId}/activity`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/users/${userId}/activity?hours=48`);
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load activity timeline
      </div>
    );
  }

  if (!data || data.activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No activities found in the last {data?.timeWindow || "48 hours"}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: any = {
      success: "default",
      failed: "destructive",
      pending: "secondary",
      completed: "default"
    };
    return variants[status] || "outline";
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Total Activities:</span> {data.totalActivities} in {data.timeWindow}
        </p>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {data.activities.map((activity) => (
            <div
              key={activity.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{activity.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(activity.timestamp), "MMM dd, yyyy HH:mm:ss")}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(activity.details.status || activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>

                  {activity.details && (
                    <div className="mt-3 bg-gray-50 p-3 rounded text-sm space-y-1">
                      {activity.details.page && (
                        <p><span className="font-semibold">Page:</span> {activity.details.page}</p>
                      )}
                      {activity.details.amount && (
                        <p><span className="font-semibold">Amount:</span> ${activity.details.amount} {activity.details.currency}</p>
                      )}
                      {activity.details.recipient && (
                        <p><span className="font-semibold">Recipient:</span> {activity.details.recipient}</p>
                      )}
                      {activity.details.sender && (
                        <p><span className="font-semibold">Sender:</span> {activity.details.sender}</p>
                      )}
                      {activity.details.documentType && (
                        <p><span className="font-semibold">Document:</span> {activity.details.documentType}</p>
                      )}
                      {activity.details.device && (
                        <p><span className="font-semibold">Device:</span> {activity.details.device}</p>
                      )}
                      {activity.details.browser && (
                        <p><span className="font-semibold">Browser:</span> {activity.details.browser}</p>
                      )}
                      {activity.details.ipAddress && (
                        <p><span className="font-semibold">IP:</span> {activity.details.ipAddress}</p>
                      )}
                      {activity.details.description && (
                        <p><span className="font-semibold">Note:</span> {activity.details.description}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
