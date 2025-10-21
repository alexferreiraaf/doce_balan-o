'use server';

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/app/lib/constants';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';

// This file now only contains the AI-related server action.
// The addTransaction action was moved to the client.

export async function getCategorySuggestions(description: string, type: 'income' | 'expense') {
  if (!description.trim()) {
    return [];
  }

  try {
    const result = await suggestTransactionCategories({
      description,
      transactionType: type,
    });
    
    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return result.suggestedCategories.filter(cat => validCategories.includes(cat));

  } catch (error) {
    console.error('Error getting category suggestions:', error);
    return [];
  }
}
