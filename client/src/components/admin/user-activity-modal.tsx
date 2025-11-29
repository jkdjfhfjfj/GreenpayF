import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const successCount = data.activities.filter(a => a.details.status === 'success').length;
  const failedCount = data.activities.filter(a => a.details.status === 'failed').length;
  const pageVisits = data.activities.filter(a => a.type === 'page_visit' || a.details.page).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Total Activities</p>
          <p className="text-2xl font-bold text-blue-600">{data.totalActivities}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Successful</p>
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failedCount}</p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600">Pages Visited</p>
          <p className="text-2xl font-bold text-purple-600">{pageVisits}</p>
        </div>
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {data.activities.map((activity) => {
            const status = activity.details.status || 'unknown';
            const hasError = activity.details.metadata?.errorMessage || activity.details.metadata?.error;
            const isPurchase = activity.action?.includes('purchase') || activity.action?.includes('card');
            
            return (
              <div
                key={activity.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition ${
                  status === 'failed' ? 'border-red-200 bg-red-50/30' : 
                  status === 'success' ? 'border-green-200' : 
                  'border-gray-200'
                }`}
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <Badge variant={getStatusBadge(status)}>
                          {status}
                        </Badge>
                      </div>
                    </div>

                    {activity.details && (
                      <div className={`mt-3 p-3 rounded text-sm space-y-2 ${
                        status === 'failed' ? 'bg-red-100/50' : 'bg-gray-50'
                      }`}>
                        {/* Purchase Details */}
                        {isPurchase && (
                          <>
                            {activity.details.amount && (
                              <p><span className="font-semibold">Amount:</span> ${activity.details.amount} {activity.details.currency || 'USD'}</p>
                            )}
                            {activity.details.cardNumber && (
                              <p><span className="font-semibold">Card:</span> {activity.details.cardNumber}</p>
                            )}
                            {activity.details.balance !== undefined && (
                              <p><span className="font-semibold">Balance:</span> ${activity.details.balance}</p>
                            )}
                          </>
                        )}

                        {/* Page and Action Info */}
                        {activity.details.page && (
                          <p><span className="font-semibold">📄 Page:</span> {activity.details.page}</p>
                        )}
                        {activity.details.action && (
                          <p><span className="font-semibold">🖱️ Action:</span> {activity.details.action}</p>
                        )}

                        {/* Transaction Details */}
                        {activity.details.recipient && (
                          <p><span className="font-semibold">Recipient:</span> {activity.details.recipient}</p>
                        )}
                        {activity.details.sender && (
                          <p><span className="font-semibold">Sender:</span> {activity.details.sender}</p>
                        )}
                        {activity.details.description && (
                          <p><span className="font-semibold">Note:</span> {activity.details.description}</p>
                        )}

                        {/* KYC/Device Details */}
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

                        {/* Error Messages */}
                        {hasError && (
                          <div className="mt-2 p-2 bg-red-200/50 border border-red-300 rounded">
                            <p className="text-red-800 font-semibold text-xs">⚠️ Error:</p>
                            <p className="text-red-700 text-xs">{hasError}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
