import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  const safeValue = parseToNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
}

/**
 * Converte qualquer valor (string, número, nulo) para um número válido.
 * Lida com formatos brasileiros (vírgula), símbolos de moeda e textos.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    // Remove símbolos de moeda e espaços
    str = str.replace(/[R$\s]/g, '');
    
    // Trata o formato de vírgula decimal (25,00 -> 25.00)
    if (str.includes(',') && !str.includes('.')) {
      str = str.replace(',', '.');
    } else if (str.includes(',') && str.includes('.')) {
      // Caso complexo como 1.234,56 -> remove o ponto de milhar e troca a vírgula
      if (str.indexOf('.') < str.indexOf(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // Caso 1,234.56 -> remove a vírgula de milhar
        str = str.replace(/,/g, '');
      }
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}
