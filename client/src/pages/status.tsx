import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Activity } from "lucide-react";
import { useLocation } from "wouter";

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message: string;
}

interface SystemStatus {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [key: string]: ServiceStatus;
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

  const serviceNames: { [key: string]: string } = {
    database: 'Database',
    objectStorage: 'Object Storage',
    exchangeRate: 'Exchange Rate API',
    statumAirtime: 'Airtime Service (Statum)',
    paystack: 'Paystack Payments',
    payHero: 'PayHero Payments',
    whatsapp: 'WhatsApp Messaging',
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6" />
              System Status
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time health monitoring of all services
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

        {/* Services Status */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Service Components</h2>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center text-gray-500">
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Loading status information...
                </div>
              </CardContent>
            </Card>
          ) : statusData?.services ? (
            Object.entries(statusData.services).map(([key, service]) => (
              <Card key={key} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="font-semibold">
                          {serviceNames[key] || key}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {service.message}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(service.status)}>
                      {service.status}
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
                  All services are continuously monitored for optimal performance.
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
