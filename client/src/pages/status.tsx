import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { useLocation } from "wouter";

interface FeatureStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
  icon?: string;
}

interface SystemStatus {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  features: {
    [key: string]: FeatureStatus;
  };
}

export default function StatusPage() {
  const [, navigate] = useLocation();

  const { data: statusData, isLoading, refetch, isFetching } = useQuery<SystemStatus>({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const featureNames: { [key: string]: string } = {
    accountAccess: 'Account Access',
    fileUploads: 'Document Uploads',
    currencyExchange: 'Currency Exchange',
    airtimePurchase: 'Airtime Purchase',
    moneyTransfers: 'Money Transfers',
    virtualCards: 'Virtual Cards',
    notifications: 'Notifications',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              App Status
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Check if all features are working properly
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Overall System Health</CardTitle>
                <CardDescription>
                  {statusData?.timestamp ? new Date(statusData.timestamp).toLocaleString() : 'Loading...'}
                </CardDescription>
              </div>
              {statusData && (
                <Badge 
                  variant={getStatusBadgeVariant(statusData.overall)}
                  className="text-base px-4 py-1"
                >
                  {statusData.overall.toUpperCase()}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Features Status */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">App Features</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center text-gray-500">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Loading status information...
                </div>
              </CardContent>
            </Card>
          ) : statusData?.features ? (
            Object.entries(statusData.features).map(([key, feature]) => (
              <Card key={key} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {feature.icon ? (
                        <span className="text-2xl">{feature.icon}</span>
                      ) : (
                        getStatusIcon(feature.status)
                      )}
                      <div>
                        <h3 className="font-semibold">
                          {featureNames[key] || key}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {feature.message}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(feature.status)}>
                      {feature.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  No status data available
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Auto-refresh enabled</p>
                <p>
                  This page automatically refreshes every 30 seconds to show the latest status.
                  All app features are continuously monitored for optimal performance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
