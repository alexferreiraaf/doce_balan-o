'use server';

import type { Transaction } from '@/app/lib/types';
import { generateReport } from '@/ai/flows/generate-report';

export async function getGenerativeReport(transactions: Transaction[], period: string) {
  if (transactions.length === 0) {
    return 'Não há dados suficientes para gerar um relatório.';
  }

  try {
    // Mapeia para um objeto mais simples para evitar erros de serialização.
    // A IA só precisa desses campos de qualquer maneira.
    const simplifiedTransactions = transactions.map(t => ({
        type: t.type,
        category: t.category,
        amount: t.amount,
        status: t.status,
    }));

    const result = await generateReport({
        transactions: simplifiedTransactions,
        period,
    });
    return result.report;
  } catch (error) {
    console.error('Error getting generative report:', error);
    return 'Ocorreu um erro ao gerar a análise. Por favor, tente novamente.';
  }
}
