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
 * Converte qualquer valor para um número válido de forma extremamente robusta.
 * Lida com R$, vírgulas, pontos e textos vindo do banco de dados.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    if (!str || str === "[object Object]") return 0;

    // Remove R$, espaços e qualquer caractere que não seja número, ponto ou vírgula
    str = str.replace(/[^\d,.-]/g, '');
    
    // Lógica para formato brasileiro (1.234,56) vs americano (1,234.56)
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato BR: remove o ponto de milhar e troca a vírgula decimal por ponto
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma && lastComma !== -1) {
      // Formato US: apenas remove as vírgulas
      str = str.replace(/,/g, '');
    } else if (lastComma !== -1) {
      // Apenas vírgula: troca por ponto
      str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}
