'use server';
/**
 * @fileOverview An AI agent that generates a financial report based on transaction data.
 *
 * - generateReport - A function that analyzes transactions and generates a written report.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a simplified transaction schema for the flow input
const SimpleTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amount: z.number(),
  status: z.string(),
});

export const GenerateReportInputSchema = z.object({
  transactions: z.array(SimpleTransactionSchema).describe('A lista de transações financeiras.'),
  period: z.string().describe('O período que o relatório deve cobrir (ex: "últimos 30 dias", "últimos 7 dias", "todo o período").'),
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  report: z.string().describe('O relatório financeiro gerado em texto, formatado em parágrafos com \\n.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const reportGenerationPrompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: { schema: GenerateReportInputSchema },
  output: { schema: GenerateReportOutputSchema },
  prompt: `Você é um assistente financeiro especialista em confeitaria.
  
  Analise a lista de transações fornecida para o período de '{{period}}'.
  
  Gere um relatório conciso e útil em português (Brasil). O relatório deve ter um tom amigável e encorajador, mas profissional.
  
  O relatório deve incluir:
  1.  **Resumo Geral**: Comece com um parágrafo de resumo sobre o desempenho geral (lucro ou prejuízo). Calcule o total de receitas (apenas transações com status 'paid'), total de despesas e o balanço final (receitas - despesas).
  2.  **Análise de Despesas**: Identifique as 2 ou 3 principais categorias de despesas e o valor total gasto nelas. Dê um breve insight sobre isso.
  3.  **Análise de Receitas**: Identifique as 2 ou 3 principais fontes de receita (categorias de renda). Dê um breve insight sobre isso.
  4.  **Vendas a Prazo (Fiado)**: Se houver transações com status 'pending' (fiado), mencione o valor total pendente e a importância de acompanhar esses recebimentos.
  5.  **Conclusão e Dica**: Termine com um parágrafo de conclusão e uma dica prática para melhorar a saúde financeira da confeitaria com base nos dados.

  Formate a saída como um único texto, usando '\\n' para separar os parágrafos. Não use markdown como títulos ou listas.

  Aqui estão os dados das transações:
  {{{json transactions}}}
  `,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const { output } = await reportGenerationPrompt(input);
    return output!;
  }
);
