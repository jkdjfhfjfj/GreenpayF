export const mockCountries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
];

export const mockRecipients = [
  {
    id: "1",
    name: "Mary Okafor",
    phone: "+2348031234567",
    country: "Nigeria",
    flag: "🇳🇬",
    initials: "MO",
  },
  {
    id: "2",
    name: "James Kone",
    email: "james@email.com",
    country: "Ghana",
    flag: "🇬🇭",
    initials: "JK",
  },
  {
    id: "3",
    name: "Amina Nyong",
    phone: "+237691234567",
    country: "Cameroon",
    flag: "🇨🇲",
    initials: "AN",
  },
];

export const mockCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
];

export const mockExchangeRates = {
  "USD-KES": 129.0,
  "KES-USD": 0.0077,
};

export const mockFAQs = [
  {
    question: "How long do transfers take?",
    answer: "Most transfers complete within 5 minutes to African countries. Bank transfers may take up to 1-2 business days.",
  },
  {
    question: "What are the transfer fees?",
    answer: "Fees start from $2.99 per transfer. The exact fee depends on the amount, destination, and delivery method.",
  },
  {
    question: "How to verify my account?",
    answer: "Upload a valid ID (passport, national ID, or driver's license), proof of address, and take a selfie. Verification usually takes 24-48 hours.",
  },
  {
    question: "Can I cancel a transfer?",
    answer: "Yes, you can cancel a transfer if it hasn't been processed yet. Go to Transactions and tap on the pending transfer to cancel.",
  },
  {
    question: "Is my money safe?",
    answer: "Yes, we use bank-level security and are regulated by financial authorities. Your funds are protected by FDIC insurance.",
  },
  {
    question: "How much can I send?",
    answer: "Daily limits start at $2,500 for verified accounts. Monthly limits can go up to $50,000 based on your verification level.",
  },
];
