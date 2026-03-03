import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converte qualquer valor para um número válido de forma extremamente robusta.
 * Garante que NUNCA retorne NaN para não quebrar os gráficos ou cálculos.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    if (!str || str === "[object Object]") return 0;

    // Remove R$, espaços e caracteres não numéricos, exceto o que pode ser separador decimal/milhar
    // Mantém apenas números, vírgulas, pontos e o sinal de menos
    str = str.replace(/[^\d,.-]/g, '');
    
    // Identifica se o formato é brasileiro (vírgula como decimal) ou americano (ponto como decimal)
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato BR: 1.234,56 ou 1234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma && lastComma !== -1) {
      // Formato US: 1,234.56
      str = str.replace(/,/g, '');
    } else if (lastComma !== -1 && lastDot === -1) {
      // Apenas vírgula: 1234,56
      str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}

export function formatCurrency(value: number) {
  const safeValue = parseToNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeValue);
}
