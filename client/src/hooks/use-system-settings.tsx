import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface SystemSettings {
  platform?: {
    maintenance_mode?: { value: string };
    maintenance_message?: { value: string };
  };
  security?: {
    pin_required?: { value: string };
    two_factor_required?: { value: string };
    kyc_auto_approval?: { value: string };
  };
  messaging?: {
    enable_otp_messages?: { value: string };
    otp_email_enabled?: { value: string };
    otp_sms_enabled?: { value: string };
    otp_whatsapp_enabled?: { value: string };
  };
  [key: string]: any;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/system-settings");
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error("Failed to fetch system settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchSettings();

    // Poll every 30 seconds
    const interval = setInterval(fetchSettings, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMaintenanceMode = () => {
    return settings?.platform?.maintenance_mode?.value === 'true';
  };

  const getMaintenanceMessage = () => {
    return settings?.platform?.maintenance_message?.value || "System maintenance in progress";
  };

  const getPinRequired = () => {
    return settings?.security?.pin_required?.value === 'true';
  };

  const getTwoFactorRequired = () => {
    return settings?.security?.two_factor_required?.value === 'true';
  };

  return {
    settings,
    isLoading,
    getMaintenanceMode,
    getMaintenanceMessage,
    getPinRequired,
    getTwoFactorRequired,
  };
}
