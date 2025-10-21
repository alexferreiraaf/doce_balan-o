'use server';

import { revalidatePath } from 'next/cache';
import { collection } from 'firebase/firestore';
import { z } from 'zod';
import { getSdks } from '@/firebase';
import { APP_ID, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/app/lib/constants';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  category: z.string().min(1, 'Categoria é obrigatória.'),
  amount: z.number().positive('O valor deve ser positivo.'),
  userId: z.string().min(1, 'ID do usuário é obrigatório.'),
});

export async function addTransaction(formData: FormData) {
  const values = {
    type: formData.get('type'),
    description: formData.get('description'),
    category: formData.get('category'),
    amount: parseFloat(formData.get('amount') as string),
    userId: formData.get('userId'),
  };

  const validatedFields = transactionSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { userId, ...transactionData } = validatedFields.data;
    const { firestore } = getSdks();
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    
    const dataWithTimestamp = {
      ...transactionData,
      dateMs: Date.now(),
      // The serverTimestamp will be added on the client-side by Firestore
    };
    
    addDocumentNonBlocking(collection(firestore, collectionPath), dataWithTimestamp);

    revalidatePath('/');
    revalidatePath('/reports');
    return { success: true };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return {
      errors: { _form: ['Falha ao registrar a transação. Tente novamente.'] },
    };
  }
}

export async function getCategorySuggestions(description: string, type: 'income' | 'expense') {
  if (!description.trim()) {
    return [];
  }

  try {
    const result = await suggestTransactionCategories({
      description,
      transactionType: type,
    });
    
    // Filter suggestions to only include valid categories for the selected type
    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return result.suggestedCategories.filter(cat => validCategories.includes(cat));

  } catch (error) {
    console.error('Error getting category suggestions:', error);
    return [];
  }
}
