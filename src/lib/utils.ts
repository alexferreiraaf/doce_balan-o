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
 * Lida com R$, vírgulas, pontos e textos vindos do banco de dados.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    if (!str || str === "[object Object]") return 0;

    // Remove R$, espaços e qualquer caractere que não seja número, ponto ou vírgula
    str = str.replace(/[^\d,.-]/g, '');
    
    // Tratamento de formato brasileiro (1.234,56)
    if (str.includes(',') && str.includes('.')) {
        if (str.indexOf('.') < str.indexOf(',')) {
            // Caso 1.234,56 -> 1234.56
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // Caso 1,234.56 -> 1234.56
            str = str.replace(/,/g, '');
        }
    } else if (str.includes(',')) {
        // Caso 25,50 -> 25.50
        str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}
