import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
  return numbers.substring(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

export const normalizePhoneNumber = (value: string | null | undefined) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

export const getWhatsAppUrl = (phone: string, message?: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  // Se o número tiver 10 ou 11 dígitos (sem DDI), adicionamos o 55 (Brasil)
  const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  const baseUrl = `https://api.whatsapp.com/send?phone=${finalPhone}`;
  
  if (message) {
    return `${baseUrl}&text=${encodeURIComponent(message)}`;
  }
  
  return baseUrl;
};