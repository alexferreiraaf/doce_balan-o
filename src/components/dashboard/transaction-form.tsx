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
import { useUser, useFirestore } from '@/firebase';
import { getCategorySuggestions } from '@/app/actions/transactions';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useProducts } from '@/app/lib/hooks/use-products';
import { AddProductDialog } from './add-product-dialog';
import { formatCurrency } from '@/lib/utils';
import type { Product, Transaction, Customer } from '@/app/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { AddCustomerDialog } from './add-customer-dialog';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { Textarea } from '../ui/textarea';
import { SaleReceiptDialog } from '../pdv/sale-receipt-dialog';
import { Timestamp } from 'firebase/firestore';


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
  additionalDescription: z.string().optional(),
  additionalValue: z.coerce.number().optional(),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao', 'fiado']).optional(),
  customerId: z.string().optional(),
  hasDownPayment: z.enum(['yes', 'no']).optional(),
  downPayment: z.coerce.number().optional(),
}).refine(data => {
    if (data.type === 'income' && !data.downPayment) {
        return !!data.paymentMethod;
    }
    return true;
}, {
    message: 'Por favor, selecione um método de pagamento.',
    path: ['paymentMethod'],
});


type TransactionFormValues = z.infer<typeof formSchema>;

interface CartItem extends Product {
  quantity: number;
}

interface TransactionFormProps {
    setSheetOpen: (open: boolean) => void;
    cart?: CartItem[];
    cartTotal?: number;
}

export function TransactionForm({ setSheetOpen, cart, cartTotal }: TransactionFormProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<'income' | 'expense'>(cart ? 'income' : 'expense');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: cart ? 'income' : 'expense',
      description: cart ? cart.map(item => `${item.quantity}x ${item.name}`).join(', ') : '',
      amount: cartTotal ?? 0,
      quantity: 1,
      discount: 0,
      deliveryFee: 0,
      additionalDescription: '',
      additionalValue: 0,
      hasDownPayment: 'no',
      downPayment: 0,
      category: cart ? INCOME_CATEGORIES[0] : undefined,
    },
  });

  const descriptionValue = form.watch('description');
  const typeValue = form.watch('type');
  const productIdValue = form.watch('productId');
  const quantityValue = form.watch('quantity');
  const discountValue = form.watch('discount');
  const deliveryFeeValue = form.watch('deliveryFee');
  const additionalValue = form.watch('additionalValue');
  const hasDownPaymentValue = form.watch('hasDownPayment');

  // Effect for category suggestion (for expenses)
  useEffect(() => {
    if (typeValue === 'expense') {
      const handler = setTimeout(() => {
        if (descriptionValue && descriptionValue.length > 3) {
          startSuggestionTransition(async () => {
            const result = await getCategorySuggestions(descriptionValue, 'expense');
            setSuggestions(result);
          });
        } else {
          setSuggestions([]);
        }
      }, 500); // 500ms debounce
      return () => clearTimeout(handler);
    }
  }, [descriptionValue, typeValue]);

  // Effect to calculate total amount for income
  useEffect(() => {
    if (typeValue === 'income' && !cart) {
        const product = products.find((p) => p.id === productIdValue);
        const productPrice = product ? product.price : 0;
        const productTotal = productPrice * Number(quantityValue || 0);
        const discount = Number(discountValue || 0);
        const deliveryFee = Number(deliveryFeeValue || 0);
        const additional = Number(additionalValue || 0);
        const totalAmount = productTotal - discount + deliveryFee + additional;
        form.setValue('amount', totalAmount);
    }
  }, [productIdValue, quantityValue, discountValue, deliveryFeeValue, additionalValue, typeValue, products, form, cart]);

  const onSubmit = (data: TransactionFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const collectionPath = `artifacts/${APP_ID}/users/${user.uid}/transactions`;
      
      let transactionDescription = data.description || '';
      const downPaymentValue = data.hasDownPayment === 'yes' ? (data.downPayment || 0) : 0;

      if (data.type === 'income' && !cart) {
        const product = products.find(p => p.id === data.productId);
        if (!product || !data.quantity) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um produto e quantidade.' });
             return;
        }
        transactionDescription = `Venda de ${data.quantity}x ${product.name}`;
        if(data.additionalDescription) {
            transactionDescription += ` (+ ${data.additionalDescription})`
        }
      } else if (data.type === 'income' && cart) {
        transactionDescription = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
      } else {
        // For expenses, use the description from the form directly.
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

      const transactionData = {
        userId: user.uid,
        type: data.type,
        description: transactionDescription,
        category: data.category,
        amount: data.amount,
        discount: data.discount || 0,
        deliveryFee: data.deliveryFee || 0,
        additionalDescription: data.additionalDescription || '',
        additionalValue: data.additionalValue || 0,
        downPayment: downPaymentValue,
        paymentMethod: paymentMethod,
        status: status,
        customerId: data.customerId || null,
        timestamp: serverTimestamp(),
        dateMs: Date.now(),
      };

      addDoc(collection(firestore, collectionPath), transactionData)
        .then((docRef) => {
            toast({ title: 'Sucesso!', description: 'Lançamento adicionado.' });
            
            // For income, show receipt
            if (data.type === 'income') {
              const finalTransaction: Transaction = {
                ...transactionData,
                id: docRef.id,
                timestamp: Timestamp.now() // Use client-side timestamp for immediate display
              };
              setLastTransaction(finalTransaction);
              setShowReceipt(true);
            }

            form.reset({type: data.type, description: '', amount: 0, quantity: 1, discount: 0, deliveryFee: 0, additionalDescription: '', additionalValue: 0, hasDownPayment: 'no', downPayment: 0});
            setSheetOpen(false);
        })
        .catch((error) => {
            console.error('Error adding transaction: ', error);
            errorEmitter.emit(
                'permission-error',
                new FirestorePermissionError({
                path: collectionPath,
                operation: 'create',
                requestResourceData: transactionData,
                })
            );
            toast({
                variant: 'destructive',
                title: 'Erro ao Adicionar Lançamento',
                description: 'Verifique suas permissões ou tente novamente.',
            });
        });
    });
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    form.reset();
    form.setValue('type', newType);
    form.setValue('quantity', 1);
    form.setValue('discount', 0);
    form.setValue('deliveryFee', 0);
    form.setValue('additionalDescription', '');
    form.setValue('additionalValue', 0);
    form.setValue('hasDownPayment', 'no');
    form.setValue('downPayment', 0);
    setSuggestions([]);
  };

  const isPOSSale = !!cart;

  const selectedCustomer = customers.find(c => c.id === form.watch('customerId'));

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!isPOSSale && (
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
          )}

          {type === 'expense' ? (
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
              {!isPOSSale ? (
                <>
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
                </>
              ) : (
                  <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Itens da Venda</FormLabel>
                      <FormControl>
                          <Textarea {...field} readOnly className="bg-muted" rows={3}/>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              )}
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
              {!isPOSSale && (
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
              )}
              
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
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="yes" id="dp-yes" />
                          </FormControl>
                          <FormLabel htmlFor="dp-yes" className="font-normal cursor-pointer">Sim</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="no" id="dp-no" />
                          </FormControl>
                          <FormLabel htmlFor="dp-no" className="font-normal cursor-pointer">Não</FormLabel>
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
                      <Input type="number" {...field} readOnly={isPOSSale} className="bg-muted font-bold" />
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
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="pix" id="pix" />
                            </FormControl>
                            <FormLabel htmlFor="pix" className="font-normal cursor-pointer">PIX</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="dinheiro" id="dinheiro" />
                            </FormControl>
                            <FormLabel htmlFor="dinheiro" className="font-normal cursor-pointer">Dinheiro</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="cartao" id="cartao" />
                            </FormControl>
                            <FormLabel htmlFor="cartao" className="font-normal cursor-pointer">Cartão</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="fiado" id="fiado" />
                            </FormControl>
                            <FormLabel htmlFor="fiado" className="font-normal cursor-pointer">Venda a Prazo (Fiado)</FormLabel>
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
                {isSuggesting && type === 'expense' && <p className="text-xs text-muted-foreground mt-1">Sugerindo categorias...</p>}
                {suggestions.length > 0 && type === 'expense' && (
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
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 space-y-2 space-y-reverse sm:space-y-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || isAuthLoading} className="w-full sm:w-auto">
                {(isPending || isAuthLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPOSSale ? 'Finalizar Venda' : 'Adicionar Lançamento'}
              </Button>
          </div>

        </form>
      </Form>
      {lastTransaction && (
          <SaleReceiptDialog
              transaction={lastTransaction}
              customer={selectedCustomer}
              cart={cart}
              isOpen={showReceipt}
              onOpenChange={setShowReceipt}
          />
      )}
    </>
  );
}
