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
 * Converte qualquer valor para um número válido.
 * Extremamente robusto para lidar com formatos de texto antigos do banco de dados.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    // Se for um objeto do Firebase ou algo estranho, retorna 0
    if (str === "[object Object]") return 0;

    // Remove R$, espaços e pontos de milhar (ex: 1.234,56 -> 1234,56)
    str = str.replace(/R\$/g, '').replace(/\s/g, '');
    
    // Se tem vírgula e ponto, remove o ponto (milhar) e troca a vírgula por ponto (decimal)
    if (str.includes(',') && str.includes('.')) {
        if (str.indexOf('.') < str.indexOf(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            str = str.replace(/,/g, '');
        }
    } else if (str.includes(',')) {
        // Se tem apenas vírgula, troca por ponto
        str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}
