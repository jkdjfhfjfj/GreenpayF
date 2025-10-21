export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0.00';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return getCurrencySymbol(currency) + '0.00';
  
  const formatted = formatNumber(num, 2);
  const symbol = getCurrencySymbol(currency);
  
  return symbol + formatted;
}

export function getCurrencySymbol(currency: string): string {
  switch (currency?.toUpperCase()) {
    case "KES":
      return "KSh ";
    case "USD":
      return "$";
    default:
      return "$";
  }
}
