'use client';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, APP_ID } from '@/app/lib/constants';
import { Badge } from '../ui/badge';
import { useAuth } from '@/app/lib/hooks/use-auth';
import { useFirestore } from '@/firebase';
import { getCategorySuggestions } from '@/app/actions/transactions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(2, 'A descrição deve ter pelo menos 2 caracteres.'),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
});

type TransactionFormValues = z.infer<typeof formSchema>;

export function TransactionForm({ setSheetOpen }: { setSheetOpen: (open: boolean) => void }) {
  const { userId, isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      description: '',
      amount: 0,
    },
  });
  
  const descriptionValue = form.watch('description');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (descriptionValue.length > 3) {
        startSuggestionTransition(async () => {
          const result = await getCategorySuggestions(descriptionValue, type);
          setSuggestions(result);
        });
      } else {
        setSuggestions([]);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [descriptionValue, type]);
  

  const onSubmit = (data: TransactionFormValues) => {
    if (!userId || !firestore) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado ou falha na conexão.' });
        return;
    }
    startTransition(async () => {
        const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
        const transactionData = {
            userId,
            type: data.type,
            description: data.description,
            category: data.category,
            amount: data.amount,
            dateMs: Date.now(),
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(firestore, collectionPath), transactionData)
            .catch(error => {
                 errorEmitter.emit(
                    'permission-error',
                    new FirestorePermissionError({
                        path: collectionPath,
                        operation: 'create',
                        requestResourceData: transactionData,
                    })
                 )
                 throw error; // Re-throw to be caught by the outer catch
            });

            toast({ title: 'Sucesso!', description: 'Lançamento adicionado.' });
            form.reset();
            setSheetOpen(false);
            // We can't revalidate from the client, but Firestore's real-time updates will handle UI changes.
        } catch (error) {
            console.error("Error adding transaction: ", error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro ao Adicionar Lançamento', 
                description: 'Verifique suas permissões ou tente novamente.' 
            });
        }
    });
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    form.setValue('type', newType);
    form.setValue('category', '');
    form.clearErrors('category');
    setSuggestions([]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`font-semibold transition-all duration-200 h-12 text-base ${
              type === 'expense'
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-red-100'
            }`}
          >
            Saída
          </Button>
          <Button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`font-semibold transition-all duration-200 h-12 text-base ${
              type === 'income'
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-green-100'
            }`}
          >
            Entrada
          </Button>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder={type === 'expense' ? 'Ex: Açúcar, Forma de bolo' : 'Ex: Venda Bolo de Cenoura'} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSuggesting && <p className="text-xs text-muted-foreground mt-1">Sugerindo categorias...</p>}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className='text-sm text-muted-foreground'>Sugestões:</span>
                  {suggestions.map(s => (
                    <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => form.setValue('category', s)}>{s}</Badge>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isAuthLoading}>
              {(isPending || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Lançamento
            </Button>
        </div>

      </form>
    </Form>
  );
}
