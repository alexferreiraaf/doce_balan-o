'use client';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
import { useUser, useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useProducts } from '@/app/lib/hooks/use-products';
import { formatCurrency } from '@/lib/utils';
import type { Product, Transaction } from '@/app/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { AddProductDialog } from '../dashboard/add-product-dialog';
import { AddCustomerDialog } from '../dashboard/add-customer-dialog';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  // Fields for income type
  productId: z.string().optional(),
  quantity: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  deliveryFee: z.coerce.number().optional(),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao', 'fiado']).optional(),
  customerId: z.string().optional(),
}).refine(data => {
    if (data.type === 'income') {
        return !!data.paymentMethod;
    }
    return true;
}, {
    message: 'Por favor, selecione um método de pagamento.',
    path: ['paymentMethod'],
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface EditTransactionFormProps {
    transaction: Transaction;
    setSheetOpen: (open: boolean) => void;
}

export function EditTransactionForm({ transaction, setSheetOpen }: EditTransactionFormProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();

  // Helper to find product from description
  const findProductByDescription = (description: string, products: Product[]): Product | undefined => {
    if (!description.startsWith('Venda de')) return undefined;
    const productName = description.split(' ').slice(3).join(' ');
    return products.find(p => p.name === productName);
  };

  const initialProduct = findProductByDescription(transaction.description, products);
  const initialQuantityMatch = transaction.description.match(/(\d+)x/);
  const initialQuantity = initialQuantityMatch ? parseInt(initialQuantityMatch[1], 10) : 1;

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction.type,
      description: transaction.type === 'expense' ? transaction.description : '',
      amount: transaction.amount,
      category: transaction.category,
      productId: initialProduct?.id || '',
      quantity: transaction.type === 'income' ? initialQuantity : 1,
      discount: transaction.discount || 0,
      deliveryFee: transaction.deliveryFee || 0,
      paymentMethod: transaction.paymentMethod || undefined,
      customerId: transaction.customerId || '',
    },
  });

  const type = form.watch('type');
  const productIdValue = form.watch('productId');
  const quantityValue = form.watch('quantity');
  const discountValue = form.watch('discount');
  const deliveryFeeValue = form.watch('deliveryFee');
  
  // Effect to calculate total amount for income
  useEffect(() => {
    if (type === 'income' && productIdValue && quantityValue && products.length > 0) {
      const product = products.find((p) => p.id === productIdValue);
      if (product) {
        const productTotal = product.price * Number(quantityValue);
        const discount = Number(discountValue || 0);
        const deliveryFee = Number(deliveryFeeValue || 0);
        const totalAmount = productTotal - discount + deliveryFee;
        form.setValue('amount', totalAmount);
      }
    }
  }, [productIdValue, quantityValue, discountValue, deliveryFeeValue, type, products, form]);

  // Effect to reset fields when product changes
  useEffect(() => {
    form.register('productId');
  }, [form]);


  const onSubmit = (data: TransactionFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const docPath = `artifacts/${APP_ID}/users/${user.uid}/transactions/${transaction.id}`;
      const transactionRef = doc(firestore, docPath);
      
      let transactionDescription = data.description || '';
      if (data.type === 'income') {
        const product = products.find(p => p.id === data.productId);
        if (!product || !data.quantity) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um produto e quantidade.' });
             return;
        }
        transactionDescription = `Venda de ${data.quantity}x ${product.name}`;
      } else {
        transactionDescription = data.description || 'Despesa sem descrição';
      }

      const transactionData = {
        type: data.type,
        description: transactionDescription,
        category: data.category,
        amount: data.amount,
        discount: data.discount || 0,
        deliveryFee: data.deliveryFee || 0,
        paymentMethod: data.paymentMethod || null,
        status: data.paymentMethod === 'fiado' ? 'pending' : 'paid',
        customerId: data.customerId || null,
        // timestamp is not updated, it keeps the original creation date
      };

      updateDoc(transactionRef, transactionData)
        .then(() => {
            toast({ title: 'Sucesso!', description: 'Lançamento atualizado.' });
            setSheetOpen(false);
        })
        .catch((error) => {
            console.error('Error updating transaction: ', error);
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                path: docPath,
                operation: 'update',
                requestResourceData: transactionData,
                })
            );
        });
    });
  };

  const transactionType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Editando uma transação de</p>
            <p className="font-bold text-lg">{transactionType === 'income' ? 'Entrada (Venda)' : 'Saída (Despesa)'}</p>
        </div>


        {transactionType === 'expense' ? (
          <>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Açúcar, Forma de bolo" {...field} />
                  </FormControl>
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
          </>
        ) : (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Produto</FormLabel>
                    <AddProductDialog />
                  </div>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={productsLoading}>
                        <SelectValue placeholder={productsLoading ? "Carregando produtos..." : "Selecione um produto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.price)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>Cliente (Opcional)</FormLabel>
                        <AddCustomerDialog />
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger disabled={customersLoading}>
                            <SelectValue placeholder={customersLoading ? "Carregando clientes..." : "Selecione um cliente"} />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Desconto (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="deliveryFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Taxa de Entrega (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} readOnly className="bg-muted font-bold" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="pix" id="pix-edit" />
                        </FormControl>
                        <FormLabel htmlFor="pix-edit" className="font-normal cursor-pointer">PIX</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="dinheiro" id="dinheiro-edit" />
                        </FormControl>
                        <FormLabel htmlFor="dinheiro-edit" className="font-normal cursor-pointer">Dinheiro</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="cartao" id="cartao-edit" />
                        </FormControl>
                        <FormLabel htmlFor="cartao-edit" className="font-normal cursor-pointer">Cartão</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="fiado" id="fiado-edit" />
                        </FormControl>
                        <FormLabel htmlFor="fiado-edit" className="font-normal cursor-pointer">Venda a Prazo (Fiado)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 space-y-2 space-y-reverse sm:space-y-0">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isAuthLoading} className="w-full sm:w-auto">
              {(isPending || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
        </div>

      </form>
    </Form>
  );
}
