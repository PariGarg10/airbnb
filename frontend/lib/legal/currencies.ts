export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { name: "Indian rupee", code: "INR", symbol: "₹" },
  { name: "Australian dollar", code: "AUD", symbol: "$" },
  { name: "Brazilian real", code: "BRL", symbol: "R$" },
  { name: "Bulgarian lev", code: "BGN", symbol: "лв." },
  { name: "Canadian dollar", code: "CAD", symbol: "$" },
  { name: "Chilean peso", code: "CLP", symbol: "$" },
  { name: "Chinese yuan", code: "CNY", symbol: "￥" },
  { name: "Colombian peso", code: "COP", symbol: "$" },
  { name: "Costa Rican colon", code: "CRC", symbol: "₡" },
  { name: "Czech koruna", code: "CZK", symbol: "Kč" },
  { name: "Danish krone", code: "DKK", symbol: "kr" },
  { name: "Egyptian pound", code: "EGP", symbol: "ج.م" },
  { name: "Emirati dirham", code: "AED", symbol: "ﺩ.ﺇ" },
  { name: "Euro", code: "EUR", symbol: "€" },
  { name: "Ghanaian cedi", code: "GHS", symbol: "GH₵" },
  { name: "Hong Kong dollar", code: "HKD", symbol: "$" },
  { name: "Hungarian forint", code: "HUF", symbol: "Ft" },
  { name: "Indonesian rupiah", code: "IDR", symbol: "Rp" },
  { name: "Israeli new shekel", code: "ILS", symbol: "₪" },
  { name: "Japanese yen", code: "JPY", symbol: "¥" },
  { name: "Kazakhstani tenge", code: "KZT", symbol: "₸" },
  { name: "Kenyan shilling", code: "KES", symbol: "KSh" },
  { name: "Malaysian ringgit", code: "MYR", symbol: "RM" },
  { name: "Mexican peso", code: "MXN", symbol: "$" },
  { name: "Moroccan dirham", code: "MAD", symbol: "" },
  { name: "New Taiwan dollar", code: "TWD", symbol: "$" },
  { name: "New Zealand dollar", code: "NZD", symbol: "$" },
  { name: "Norwegian krone", code: "NOK", symbol: "kr" },
  { name: "Peruvian sol", code: "PEN", symbol: "S/" },
  { name: "Philippine peso", code: "PHP", symbol: "₱" },
  { name: "Polish zloty", code: "PLN", symbol: "zł" },
  { name: "Pound sterling", code: "GBP", symbol: "£" },
  { name: "Qatari riyal", code: "QAR", symbol: "ر.ق" },
  { name: "Romanian leu", code: "RON", symbol: "lei" },
  { name: "Saudi Arabian riyal", code: "SAR", symbol: "SR" },
  { name: "Singapore dollar", code: "SGD", symbol: "$" },
  { name: "South African rand", code: "ZAR", symbol: "R" },
  { name: "South Korean won", code: "KRW", symbol: "₩" },
  { name: "Swedish krona", code: "SEK", symbol: "kr" },
  { name: "Swiss franc", code: "CHF", symbol: "" },
  { name: "Thai baht", code: "THB", symbol: "฿" },
  { name: "Turkish lira", code: "TRY", symbol: "₺" },
  { name: "Ugandan shilling", code: "UGX", symbol: "USh" },
  { name: "Ukrainian hryvnia", code: "UAH", symbol: "₴" },
  { name: "United States dollar", code: "USD", symbol: "$" },
  { name: "Uruguayan peso", code: "UYU", symbol: "$U" },
  { name: "Vietnamese dong", code: "VND", symbol: "₫" },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

export function formatCurrencyLabel(currency: CurrencyOption) {
  const tail = currency.symbol ? `${currency.code} – ${currency.symbol}` : currency.code;
  return tail;
}
