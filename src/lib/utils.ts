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
 * Extremamente robusto para lidar com formatos de texto antigos, 
 * símbolos de moeda, espaços e separadores brasileiros.
 */
export function parseToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  
  try {
    let str = String(value).trim();
    // Se for um objeto do Firebase ou string vazia, retorna 0
    if (!str || str === "[object Object]") return 0;

    // Limpeza radical: remove R$, espaços e qualquer caractere que não seja número, ponto ou vírgula
    str = str.replace(/[^\d,.-]/g, '');
    
    // Tratamento de formato brasileiro (1.234,56) vs americano (1,234.56)
    if (str.includes(',') && str.includes('.')) {
        // Se o ponto vem antes da vírgula, o ponto é milhar e a vírgula é decimal
        if (str.indexOf('.') < str.indexOf(',')) {
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // Caso contrário, remove a vírgula (milhar)
            str = str.replace(/,/g, '');
        }
    } else if (str.includes(',')) {
        // Se tem apenas vírgula, troca por ponto decimal
        str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
}
