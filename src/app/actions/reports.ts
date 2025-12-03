'use server';

import { generateReport } from '@/ai/flows/generate-report';

// Definindo um tipo simplificado para a transação que será usada pela IA
type SimpleTransaction = {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    status: string;
    dateMs: number;
}

export async function getGenerativeReport(transactions: SimpleTransaction[], period: string) {
  if (transactions.length === 0) {
    return 'Não há dados suficientes para gerar um relatório.';
  }

  try {
    // O objeto de transação já está simplificado, então podemos passá-lo diretamente.
    const result = await generateReport({
        transactions: transactions,
        period,
    });
    return result.report;
  } catch (error) {
    console.error('Error getting generative report:', error);
    return 'Ocorreu um erro ao gerar a análise. Por favor, tente novamente.';
  }
}
