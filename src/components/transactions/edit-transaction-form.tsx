'use client';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

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
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, Transaction, CartItem } from '@/app/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { AddProductDialog } from '../products/add-product-dialog';
import { AddCustomerDialog } from '../dashboard/add-customer-dialog';
import { Textarea } from '../ui/textarea';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  // Fields for income type
  cartItems: z.array(cartItemSchema).optional(),
  discount: z.coerce.number().optional(),
  deliveryFee: z.coerce.number().optional(),
  additionalDescription: z.string().optional(),
  additionalValue: z.coerce.number().optional(),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao', 'fiado']).optional(),
  customerId: z.string().optional(),
  hasDownPayment: z.enum(['yes', 'no']).optional(),
  downPayment: z.coerce.number().optional(),
  transactionDate: z.date({ required_error: 'Por favor, selecione uma data.' }),
}).refine(data => {
    if (data.type === 'income' && data.hasDownPayment !== 'yes') {
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
    
    // Extracts product name from "Venda de 1x Chocolate" or "Venda de 1x Chocolate (+ Adicional)"
    const nameMatch = description.match(/Venda de \d+x (.+?)(?: \(.+\))?$/);
    if (!nameMatch) return undefined;

    const productName = nameMatch[1];
    return products.find(p => p.name === productName);
  };

  const initialProduct = findProductByDescription(transaction.description, products);
  const initialQuantityMatch = transaction.description.match(/(\d+)x/);
  const initialQuantity = initialQuantityMatch ? parseInt(initialQuantityMatch[1], 10) : 1;
  
  let initialCartItems: CartItem[] = transaction.cartItems || [];
  if (initialCartItems.length === 0 && initialProduct) {
      initialCartItems = [{
          id: initialProduct.id,
          name: initialProduct.name,
          price: initialProduct.price,
          quantity: initialQuantity
      }];
  }

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction.type,
      description: transaction.type === 'expense' ? transaction.description : '',
      amount: transaction.amount,
      category: transaction.category,
      cartItems: initialCartItems,
      discount: transaction.discount || 0,
      deliveryFee: transaction.deliveryFee || 0,
      additionalDescription: transaction.additionalDescription || '',
      additionalValue: transaction.additionalValue || 0,
      paymentMethod: transaction.paymentMethod || undefined,
      customerId: transaction.customerId || '',
      hasDownPayment: (transaction.downPayment || 0) > 0 ? 'yes' : 'no',
      downPayment: transaction.downPayment || 0,
      transactionDate: transaction.dateMs ? new Date(transaction.dateMs) : (transaction.timestamp?.toDate ? transaction.timestamp.toDate() : new Date()),
    },
  });

  const type = form.watch('type');
  const hasDownPaymentValue = form.watch('hasDownPayment');
  
  // Effect to calculate total amount for income
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        value.type === 'income' &&
        (name?.startsWith('cartItems') || ['discount', 'deliveryFee', 'additionalValue'].includes(name as string))
      ) {
        const items = value.cartItems || [];
        const productsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const discount = Number(value.discount || 0);
        const deliveryFee = Number(value.deliveryFee || 0);
        const additional = Number(value.additionalValue || 0);
        const totalAmount = productsTotal - discount + deliveryFee + additional;
        form.setValue('amount', totalAmount > 0 ? totalAmount : 0, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const addProductToCart = () => {
      const current = form.getValues('cartItems') || [];
      form.setValue('cartItems', [...current, { id: '', name: '', price: 0, quantity: 1 }], { shouldValidate: true });
  };
  
  const removeProductFromCart = (index: number) => {
      const current = form.getValues('cartItems') || [];
      form.setValue('cartItems', current.filter((_, i) => i !== index), { shouldValidate: true });
  };
  
  const updateCartItem = (index: number, productId: string) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      
      const current = form.getValues('cartItems') || [];
      const updated = [...current];
      updated[index] = { ...updated[index], id: product.id, name: product.name, price: product.price };
      form.setValue('cartItems', updated, { shouldValidate: true });
  };


  const onSubmit = (data: TransactionFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const docPath = `artifacts/${APP_ID}/users/${transaction.userId}/transactions/${transaction.id}`;
      const transactionRef = doc(firestore, docPath);
      
      let transactionDescription = data.description || '';
      const downPaymentValue = data.hasDownPayment === 'yes' ? (data.downPayment || 0) : 0;

      if (data.type === 'income') {
        const cart = data.cartItems || [];
        if (cart.length === 0 || cart.some(i => !i.id)) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Adicione pelo menos um produto válido.' });
             return;
        }
        transactionDescription = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
        if(data.additionalDescription) {
            transactionDescription += ` (+ ${data.additionalDescription})`
        }
      } else {
        transactionDescription = data.description || 'Despesa sem descrição';
      }
        
      if (downPaymentValue > 0) {
        transactionDescription += ` (Entrada de ${formatCurrency(downPaymentValue)})`;
      }


      let paymentMethod = data.paymentMethod || null;
      let status: 'paid' | 'pending' = 'paid';

      if (downPaymentValue > 0) {
        paymentMethod = 'fiado';
        status = 'pending';
      } else if (data.paymentMethod === 'fiado') {
        status = 'pending';
      }

      const customDate = data.transactionDate;
      const transactionData: any = {
        type: data.type,
        description: transactionDescription,
        category: data.category,
        amount: data.amount,
        discount: data.discount || 0,
        deliveryFee: data.deliveryFee || 0,
        additionalDescription: data.type === 'expense' ? data.additionalDescription || '' : data.additionalDescription || '',
        additionalValue: data.additionalValue || 0,
        downPayment: downPaymentValue,
        paymentMethod: paymentMethod,
        status: status,
        customerId: data.customerId || null,
        dateMs: customDate.getTime(),
        timestamp: Timestamp.fromDate(customDate),
      };
      
      if (data.type === 'income') {
          transactionData.cartItems = data.cartItems;
      }

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
            {transaction.isInstallment && (
                <div className="bg-purple-100 text-purple-800 p-3 rounded-md mb-4 flex flex-col">
                   <span className="font-bold text-sm">Esta despesa é a parcela {transaction.installmentIndex}/{transaction.totalInstallments} de uma compra parcelada.</span>
                   {transaction.creditCard && <span className="text-xs mt-1">💳 Cartão: {transaction.creditCard}</span>}
                </div>
            )}
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
             <FormField
              control={form.control}
              name="additionalDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: Gasto referente a compra de..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                <div className="flex justify-between items-center mb-2">
                    <FormLabel className="text-base font-bold">Produtos</FormLabel>
                    <div className="flex items-center gap-2">
                        <AddProductDialog />
                        <Button type="button" variant="outline" size="sm" onClick={addProductToCart}>
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Produto
                        </Button>
                    </div>
                </div>
                
                {form.watch('cartItems')?.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                        <FormField
                            control={form.control}
                            name={`cartItems.${index}.id`}
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormLabel className="text-xs text-muted-foreground">Produto</FormLabel>
                                    <Select onValueChange={(val) => { field.onChange(val); updateCartItem(index, val); }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger disabled={productsLoading}>
                                                <SelectValue placeholder="Selecione..." />
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
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`cartItems.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormLabel className="text-xs text-muted-foreground">Qtd.</FormLabel>
                                    <FormControl>
                                        <Input type="number" min="1" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" className="text-destructive mb-0.5" onClick={() => removeProductFromCart(index)} disabled={(form.watch('cartItems')?.length || 0) <= 1}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
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
                    name="additionalDescription"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Adicional (Desc.)</FormLabel>
                        <FormControl>
                            <Input placeholder="Ex: Mais Nutella" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="additionalValue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor Adicional (R$)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="0,00" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
              name="hasDownPayment"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Houve valor de entrada?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="yes" id="dp-yes-edit" />
                        </FormControl>
                        <FormLabel htmlFor="dp-yes-edit" className="font-normal cursor-pointer">Sim</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="no" id="dp-no-edit" />
                        </FormControl>
                        <FormLabel htmlFor="dp-no-edit" className="font-normal cursor-pointer">Não</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasDownPaymentValue === 'yes' && (
              <FormField
                control={form.control}
                name="downPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Entrada (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
            
            {hasDownPaymentValue !== 'yes' && (
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
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="transactionDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Lançamento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal h-10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : "Escolha uma data"}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
