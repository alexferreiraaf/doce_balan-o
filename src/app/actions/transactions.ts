'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';
import { getSdks } from '@/firebase/server-init';
import { APP_ID, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/app/lib/constants';
import { suggestTransactionCategories } from '@/ai/flows/suggest-transaction-categories';
import { headers } from 'next/headers';
import { auth } from 'firebase-admin';

// Remove userId from the client-side schema
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descrição é obrigatória.'),
  category: z.string().min(1, 'Categoria é obrigatória.'),
  amount: z.number().positive('O valor deve ser positivo.'),
});

async function getUserIdFromSession(): Promise<string | null> {
  const sessionCookie = headers().get('__session');
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedToken = await auth().verifySessionCookie(sessionCookie, true);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}


export async function addTransaction(formData: FormData) {
    const userId = await getUserIdFromSession();
    if (!userId) {
        return {
            errors: { _form: ['Usuário não autenticado.'] },
        };
    }

    const values = {
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

    const { ...transactionData } = validatedFields.data;
    const { firestore } = getSdks();
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    
    const dataWithTimestamp = {
        ...transactionData,
        userId: userId, // Add the securely obtained userId
        dateMs: Date.now(),
        timestamp: serverTimestamp(),
    };
    
    try {
        await addDoc(collection(firestore, collectionPath), dataWithTimestamp);
    } catch (error) {
        console.error("Error adding document: ", error);
        return {
        errors: { _form: ['Falha ao registrar a transação.'] },
        };
    }

    revalidatePath('/');
    revalidatePath('/reports');
    return { success: true };
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
