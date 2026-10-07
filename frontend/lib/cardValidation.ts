export type CardBrand = "visa" | "mastercard" | "amex" | "rupay" | "unknown";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function detectCardBrand(number: string): CardBrand {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "visa";
  if (/^3[47]/.test(d)) return "amex";
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(d)) return "mastercard";
  if (/^(60|6521|6522)/.test(d)) return "rupay";
  return "unknown";
}

export function formatCardNumber(number: string): string {
  const d = digitsOnly(number).slice(0, detectCardBrand(number) === "amex" ? 15 : 16);
  if (detectCardBrand(d) === "amex") {
    return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }
  return d.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function luhnValid(number: string): boolean {
  const d = digitsOnly(number);
  if (d.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = d.length - 1; i >= 0; i -= 1) {
    let n = Number(d[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function expiryValid(mmYy: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(mmYy.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end >= today;
}

export function cvvValid(cvv: string, brand: CardBrand): boolean {
  const d = digitsOnly(cvv);
  if (brand === "amex") return d.length === 4;
  return d.length === 3 || d.length === 4;
}

export function cardBrandLabel(brand: CardBrand): string {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "Amex";
    case "rupay":
      return "RuPay";
    default:
      return "Card";
  }
}

export function cardLast4(number: string): string {
  const d = digitsOnly(number);
  return d.slice(-4).padStart(4, "0");
}
