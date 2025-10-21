'use server';

/**
 * @fileOverview An AI agent that suggests transaction categories based on the transaction description.
 *   It uses a tool to fetch categories and then suggests categories based on the description.
 *
 * - suggestTransactionCategories - A function that suggests transaction categories based on the transaction description.
 * - SuggestTransactionCategoriesInput - The input type for the suggestTransactionCategories function.
 * - SuggestTransactionCategoriesOutput - The return type for the suggestTransactionCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTransactionCategoriesInputSchema = z.object({
  description: z
    .string()
    .describe("The description of the transaction, e.g. 'Sugar, eggs, flour for cake'"),
  transactionType: z.enum(['income', 'expense']).describe('The type of the transaction (income or expense).'),
});
export type SuggestTransactionCategoriesInput = z.infer<
  typeof SuggestTransactionCategoriesInputSchema
>;

const SuggestTransactionCategoriesOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe('An array of suggested categories for the transaction.'),
});
export type SuggestTransactionCategoriesOutput = z.infer<
  typeof SuggestTransactionCategoriesOutputSchema
>;

export async function suggestTransactionCategories(
  input: SuggestTransactionCategoriesInput
): Promise<SuggestTransactionCategoriesOutput> {
  return suggestTransactionCategoriesFlow(input);
}

const categorySuggestionTool = ai.defineTool({
  name: 'suggestCategory',
  description: 'Suggests categories for a given transaction description and type.',
  inputSchema: SuggestTransactionCategoriesInputSchema,
  outputSchema: SuggestTransactionCategoriesOutputSchema,
},
async (input) => {
    const suggestTransactionCategoriesPrompt = ai.definePrompt({
        name: 'suggestTransactionCategoriesPrompt',
        input: {schema: SuggestTransactionCategoriesInputSchema},
        output: {schema: SuggestTransactionCategoriesOutputSchema},
        prompt: `You are a helpful assistant that suggests categories for financial transactions.

      Given the following transaction description and transaction type, suggest up to 3 relevant categories.
      The categories should be appropriate for the transaction type (income or expense).

      Transaction Description: {{{description}}}
      Transaction Type: {{{transactionType}}}

      Respond with a JSON array of strings. For example: ["Groceries", "Supplies"].`,
      });

      const {output} = await suggestTransactionCategoriesPrompt(input);
      return output!;
});

const suggestTransactionCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestTransactionCategoriesFlow',
    inputSchema: SuggestTransactionCategoriesInputSchema,
    outputSchema: SuggestTransactionCategoriesOutputSchema,
  },
  async (input) => {
    const {suggestedCategories} = await categorySuggestionTool(input);
    return suggestedCategories;
  }
);

