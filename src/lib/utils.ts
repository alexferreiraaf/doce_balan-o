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

    // Remove R$, espaços e qualquer caractere que não seja número, vírgula, ponto ou sinal de menos
    str = str.replace(/[^\d,.-]/g, '');
    
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato BR: 1.234,56 -> 1234.56
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (lastDot > lastComma && lastComma !== -1) {
      // Formato US: 1,234.56 -> 1234.56
      str = str.replace(/,/g, '');
    } else if (lastComma !== -1 && lastDot === -1) {
      // Apenas vírgula: 1234,56 -> 1234.56
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

export function formatDate(date: any) {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'number') {
    d = new Date(date);
  } else if (date.toDate && typeof date.toDate === 'function') {
    // Firebase Timestamp
    d = date.toDate();
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR').format(d);
}

/**
 * Converte um arquivo de imagem para Base64 (Data URL), redimensionando e
 * comprimindo automaticamente para caber com folga no limite de 1 MB do Firestore.
 */
export function imageFileToBase64(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = (error) => reject(error);
    reader.onload = () => {
      const rawBase64 = reader.result as string;
      if (typeof window === 'undefined') {
        resolve(rawBase64);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawBase64);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Tenta WebP primeiro (mantém transparência e gera arquivos leves)
          let compressed = canvas.toDataURL('image/webp', quality);
          if (!compressed.startsWith('data:image/webp')) {
            compressed = canvas.toDataURL('image/jpeg', quality);
          }

          // Retorna o menor entre o comprimido e o original (caso a imagem original já seja muito pequena)
          resolve(compressed.length < rawBase64.length ? compressed : rawBase64);
        } catch {
          resolve(rawBase64);
        }
      };
      img.onerror = () => resolve(rawBase64);
      img.src = rawBase64;
    };
  });
}
