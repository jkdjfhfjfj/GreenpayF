import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AppSettings {
  withdrawal_fee?: number;
  exchange_rate_margin?: number;
  transfer_fee?: number;
  virtual_card_fee?: number;
  two_factor_required?: boolean;
  kyc_auto_approval?: boolean;
  max_daily_limit?: number;
  min_transaction_amount?: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  withdrawal_fee: 1.00,
  exchange_rate_margin: 0.05,
  transfer_fee: 2.50,
  virtual_card_fee: 60.00,
  two_factor_required: true,
  kyc_auto_approval: false,
  max_daily_limit: 10000,
  min_transaction_amount: 1.00
};

export function useAppSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/settings/public"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/settings/public");
        const json = await response.json();
        return json;
      } catch (err) {
        console.error('Settings fetch error:', err);
        return { settings: {}, defaults: DEFAULT_SETTINGS };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(data?.settings || {}),
  };

  return {
    settings,
    isLoading,
    error,
    withdrawalFee: settings.withdrawal_fee || 1.00,
    exchangeMargin: settings.exchange_rate_margin || 0.05,
    transferFee: settings.transfer_fee || 2.50,
    virtualCardFee: settings.virtual_card_fee || 60.00,
    twoFactorRequired: settings.two_factor_required !== false,
    maxDailyLimit: settings.max_daily_limit || 10000,
  };
}
