'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { getSdks } from '@/firebase/server-init';
import { APP_ID, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/app/lib/constants';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';

const transactionSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório.'),
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  category: z.string().min(1, 'Categoria é obrigatória.'),
  amount: z.number().positive('O valor deve ser positivo.'),
});

export async function addTransaction(formData: FormData) {
    const values = {
        userId: formData.get('userId'),
        type: formData.get('type'),
        description: formData.get('description'),
        category: formData.get('category'),
        amount: parseFloat(formData.get('amount') as string),
    };

    const validatedFields = transactionSchema.safeParse(values);

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const { userId, type, description, category, amount } = validatedFields.data;
        const { firestore } = getSdks();
        const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
        
        await addDoc(collection(firestore, collectionPath), {
            userId,
            type,
            description,
            category,
            amount,
            dateMs: Date.now(),
            timestamp: serverTimestamp(),
        });

        revalidatePath('/');
        revalidatePath('/reports');
        return { success: true };
    } catch (error) {
        console.error("Error adding transaction: ", error);
        // This is a generic error message.
        // In a real app, you might want to log the error and return a more user-friendly message.
        return {
            errors: {
                _form: ["Falha ao registrar a transação. Por favor, tente novamente."],
            }
        }
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
    
    const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return result.suggestedCategories.filter(cat => validCategories.includes(cat));

  } catch (error) {
    console.error('Error getting category suggestions:', error);
    return [];
  }
}
