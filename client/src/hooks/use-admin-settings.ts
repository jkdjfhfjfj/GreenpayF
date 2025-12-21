import { useState, useEffect, useCallback } from 'react';

interface AdminSettings {
  fees: {
    transfer_fee: string;
    exchange_rate_margin: string;
    virtual_card_fee: string;
    withdrawal_fee: string;
  };
  security: {
    two_factor_required: boolean;
    kyc_auto_approval: boolean;
    enable_otp_feature: boolean;
    max_daily_limit: string;
    min_transaction_amount: string;
  };
  notifications: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    admin_alerts: boolean;
  };
  general: {
    platform_name: string;
    support_email: string;
    default_currency: string;
    session_timeout: string;
    terms_url: string;
    maintenance_message: string;
    maintenance_mode: boolean;
    api_rate_limit: string;
    max_upload_size: string;
  };
  whatsapp: {
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    is_active: boolean;
  };
}

const DEFAULT_SETTINGS: AdminSettings = {
  fees: {
    transfer_fee: '2.50',
    exchange_rate_margin: '0.05',
    virtual_card_fee: '5.00',
    withdrawal_fee: '1.00'
  },
  security: {
    two_factor_required: true,
    kyc_auto_approval: false,
    enable_otp_feature: true,
    max_daily_limit: '10000',
    min_transaction_amount: '1.00'
  },
  notifications: {
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    admin_alerts: true
  },
  general: {
    platform_name: 'GreenPay',
    support_email: 'support@greenpay.com',
    default_currency: 'USD',
    session_timeout: '30',
    terms_url: 'https://greenpay.com/terms',
    maintenance_message: '',
    maintenance_mode: false,
    api_rate_limit: '1000',
    max_upload_size: '10'
  },
  whatsapp: {
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    is_active: false
  }
};

const STORAGE_KEY = 'greenpay_admin_settings';
const STORAGE_VERSION = 'v1';

export function useAdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse admin settings', error);
      }
    }
    setIsLoaded(true);

    // Listen for changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse storage change', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save settings to localStorage and broadcast via custom event
  const saveSettings = useCallback((newSettings: AdminSettings) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    
    // Broadcast to other components via custom event
    window.dispatchEvent(
      new CustomEvent('admin-settings-updated', { detail: newSettings })
    );
  }, []);

  const updateFees = useCallback((fees: Partial<AdminSettings['fees']>) => {
    setSettings((prev) => ({
      ...prev,
      fees: { ...prev.fees, ...fees }
    }));
  }, []);

  const updateSecurity = useCallback((security: Partial<AdminSettings['security']>) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, ...security }
    }));
  }, []);

  const updateNotifications = useCallback((notifications: Partial<AdminSettings['notifications']>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...notifications }
    }));
  }, []);

  const updateGeneral = useCallback((general: Partial<AdminSettings['general']>) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, ...general }
    }));
  }, []);

  const updateWhatsApp = useCallback((whatsapp: Partial<AdminSettings['whatsapp']>) => {
    setSettings((prev) => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, ...whatsapp }
    }));
  }, []);

  return {
    settings,
    saveSettings,
    updateFees,
    updateSecurity,
    updateNotifications,
    updateGeneral,
    updateWhatsApp,
    isLoaded
  };
}

// Helper to subscribe to settings changes globally
export function subscribeToAdminSettings(callback: (settings: AdminSettings) => void) {
  const handler = (e: Event) => {
    const event = e as CustomEvent<AdminSettings>;
    callback(event.detail);
  };
  
  window.addEventListener('admin-settings-updated', handler);
  
  return () => {
    window.removeEventListener('admin-settings-updated', handler);
  };
}
