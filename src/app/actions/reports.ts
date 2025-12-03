'use server';

import type { Transaction } from '@/app/lib/types';
import { generateReport } from '@/ai/flows/generate-report';

export async function getGenerativeReport(transactions: Transaction[], period: string) {
  if (transactions.length === 0) {
    return 'Não há dados suficientes para gerar um relatório.';
  }

  try {
    // We might need to simplify the transaction objects if they are too large
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
