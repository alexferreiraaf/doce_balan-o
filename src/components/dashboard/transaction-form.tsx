'use client';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, Truck, Bike } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

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
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { Textarea } from '../ui/textarea';


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
  
  // Storefront / Customer fields
  deliveryType: z.enum(['delivery', 'pickup']).optional(),
  customerName: z.string().optional(),
  customerWhatsapp: z.string().optional(),
  customerCep: z.string().optional(),
  customerStreet: z.string().optional(),
  customerNumber: z.string().optional(),
  customerComplement: z.string().optional(),
  customerNeighborhood: z.string().optional(),
  customerCity: z.string().optional(),
  customerState: z.string().optional(),
  
  hasDownPayment: z.enum(['yes', 'no']).optional(),
  downPayment: z.coerce.number().optional(),
}).refine(data => {
    if (data.type === 'income' && data.hasDownPayment !== 'yes') {
        return !!data.paymentMethod;
    }
    return true;
}, {
    message: 'Por favor, selecione um método de pagamento.',
    path: ['paymentMethod'],
}).refine(data => {
    if (data.fromStorefront && !data.customerName) {
        return false;
    }
    return true;
}, {
    message: 'O nome é obrigatório.',
    path: ['customerName'],
}).refine(data => {
    if (data.fromStorefront && data.deliveryType === 'delivery' && !data.customerCep) {
        return false;
    }
    return true;
}, {
    message: 'O CEP é obrigatório para entrega.',
    path: ['customerCep'],
});


type TransactionFormValues = z.infer<typeof formSchema> & { fromStorefront?: boolean };

interface CartItem extends Product {
  quantity: number;
}

interface TransactionFormProps {
    setSheetOpen: (open: boolean) => void;
    onSaleFinalized?: (transaction: Transaction, customer?: Customer) => void;
    cart?: CartItem[];
    cartTotal?: number;
    fromStorefront?: boolean;
}

export function TransactionForm({ setSheetOpen, onSaleFinalized, cart, cartTotal, fromStorefront = false }: TransactionFormProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<'income' | 'expense'>(cart ? 'income' : 'expense');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const { products, loading: productsLoading } = useProducts();
  const { customers, loading: customersLoading } = useCustomers();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromStorefront,
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
      deliveryType: fromStorefront ? 'pickup' : undefined,
    },
  });

  const descriptionValue = form.watch('description');
  const typeValue = form.watch('type');
  const hasDownPaymentValue = form.watch('hasDownPayment');
  const deliveryTypeValue = form.watch('deliveryType');

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
    const subscription = form.watch((value, { name }) => {
      if (
        value.type === 'income' &&
        !cart &&
        ['productId', 'quantity', 'discount', 'deliveryFee', 'additionalValue'].includes(name as string)
      ) {
        const product = products.find((p) => p.id === value.productId);
        const productPrice = product ? product.price : 0;
        const productTotal = productPrice * Number(value.quantity || 0);
        const discount = Number(value.discount || 0);
        const deliveryFee = Number(value.deliveryFee || 0);
        const additional = Number(value.additionalValue || 0);
        const totalAmount = productTotal - discount + deliveryFee + additional;
        form.setValue('amount', totalAmount > 0 ? totalAmount : 0, { shouldValidate: true });
      } else if (
        value.type === 'income' &&
        cart &&
        ['discount', 'deliveryFee', 'additionalValue'].includes(name as string)
      ) {
        const cartTotalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discount = Number(value.discount || 0);
        const deliveryFee = Number(value.deliveryFee || 0);
        const additional = Number(value.additionalValue || 0);
        const totalAmount = cartTotalAmount - discount + deliveryFee + additional;
        form.setValue('amount', totalAmount > 0 ? totalAmount : 0, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, products, cart]);

  useEffect(() => {
    if (deliveryTypeValue === 'pickup') {
      form.setValue('deliveryFee', 0);
    }
  }, [deliveryTypeValue, form]);

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        return;
    }

    setIsFetchingCep(true);
    try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (data.erro) {
            toast({ variant: 'destructive', title: 'CEP não encontrado' });
            form.setValue('customerStreet', '');
            form.setValue('customerNeighborhood', '');
            form.setValue('customerCity', '');
            form.setValue('customerState', '');
        } else {
            form.setValue('customerStreet', data.logradouro);
            form.setValue('customerNeighborhood', data.bairro);
            form.setValue('customerCity', data.localidade);
            form.setValue('customerState', data.uf);
            form.setFocus('customerNumber');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao buscar CEP', description: 'Não foi possível buscar o endereço. Tente novamente.' });
        console.error("CEP search error:", error);
    } finally {
        setIsFetchingCep(false);
    }
  };


  const onSubmit = async (data: TransactionFormValues) => {
    // For storefront, user will be anonymous, so we need a target user to save the transaction to.
    const targetUserId = fromStorefront ? process.env.NEXT_PUBLIC_STOREFRONT_USER_ID : user?.uid;

    if (!targetUserId || !firestore) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar o pedido. Tente novamente mais tarde.' });
        return;
    }

    startTransition(async () => {
      const collectionPath = `artifacts/${APP_ID}/users/${targetUserId}/transactions`;
      
      let transactionDescription = data.description || '';
      const downPaymentValue = data.hasDownPayment === 'yes' ? (data.downPayment || 0) : 0;

      if (data.type === 'income' && !cart) {
        const product = products.find(p => p.id === data.productId);
        if (!product || !data.quantity) {
             toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um produto e quantidade.' });
             return;
        }
        transactionDescription = `Venda de ${data.quantity}x ${product.name}`;
      } else if (data.type === 'income' && cart) {
        transactionDescription = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
      } else {
        // For expenses, use the description from the form directly.
        transactionDescription = data.description || 'Despesa sem descrição';
      }

      if(data.type === 'income' && data.additionalDescription) {
        transactionDescription += ` (+ ${data.additionalDescription})`
      }

      if (downPaymentValue > 0) {
        transactionDescription += ` (Entrada de ${formatCurrency(downPaymentValue)})`;
      }
      
      if (fromStorefront && data.deliveryType) {
        transactionDescription += ` - ${data.deliveryType === 'delivery' ? 'Entrega' : 'Retirada'}`;
      }


      let paymentMethod = data.paymentMethod || null;
      let status: 'paid' | 'pending' = 'paid';

      if (downPaymentValue > 0) {
        paymentMethod = 'fiado';
        status = 'pending';
      } else if (data.paymentMethod === 'fiado') {
        status = 'pending';
      }

      if (fromStorefront) {
          status = 'pending';
      }
      
      let customerId: string | null = null;
      let newCustomer: Customer | undefined;
      
      if (fromStorefront && data.customerName) {
         const customerData: Omit<Customer, 'id'> = {
            name: data.customerName,
            whatsapp: data.customerWhatsapp || '',
            cep: data.customerCep || '',
            street: data.customerStreet || '',
            number: data.customerNumber || '',
            complement: data.customerComplement || '',
            neighborhood: data.customerNeighborhood || '',
            city: data.customerCity || '',
            state: data.customerState || '',
        };

        try {
            const customerCollection = collection(firestore, `artifacts/${APP_ID}/customers`);
            const docRef = await addDoc(customerCollection, customerData);
            customerId = docRef.id;
            newCustomer = { id: docRef.id, ...customerData };
        } catch (error) {
             console.error('Error adding new customer from storefront: ', error);
             toast({
                variant: 'destructive',
                title: 'Erro ao Salvar Cliente',
                description: 'Não foi possível salvar os seus dados. Tente novamente.',
            });
            return; // Stop transaction submission
        }
      }


      const transactionData = {
        userId: targetUserId,
        type: data.type,
        description: transactionDescription,
        category: fromStorefront ? 'Venda Online' : data.category,
        amount: data.amount,
        discount: data.discount || 0,
        deliveryFee: data.deliveryFee || 0,
        additionalDescription: data.type === 'expense' ? data.additionalDescription || '' : data.additionalDescription || '',
        additionalValue: data.additionalValue || 0,
        downPayment: downPaymentValue,
        paymentMethod: paymentMethod,
        status: status,
        customerId: customerId,
        timestamp: serverTimestamp(),
        dateMs: Date.now(),
      };

      addDoc(collection(firestore, collectionPath), transactionData)
        .then((docRef) => {
            toast({ title: 'Sucesso!', description: fromStorefront ? 'Pedido enviado!' : 'Lançamento adicionado.' });
            
            if (data.type === 'income' && onSaleFinalized) {
              onSaleFinalized({ ...transactionData, id: docRef.id } as Transaction, newCustomer);
            }

            form.reset({type: data.type, description: '', amount: 0, quantity: 1, discount: 0, deliveryFee: 0, additionalDescription: '', additionalValue: 0, hasDownPayment: 'no', downPayment: 0, deliveryType: fromStorefront ? 'pickup' : undefined});
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
              {!isPOSSale && (
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
              )} 
              {isPOSSale && (
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
              
              {fromStorefront && (
                 <FormField
                    control={form.control}
                    name="deliveryType"
                    render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Opção de Entrega</FormLabel>
                        <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                        >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="pickup" id="pickup" />
                            </FormControl>
                            <FormLabel htmlFor="pickup" className="font-normal cursor-pointer flex items-center gap-2"><Package className="w-4 h-4"/> Retirada</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value="delivery" id="delivery" />
                            </FormControl>
                            <FormLabel htmlFor="delivery" className="font-normal cursor-pointer flex items-center gap-2"><Bike className="w-4 h-4"/> Entrega</FormLabel>
                            </FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
              
                <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="customerWhatsapp"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                            <Input placeholder="(11) 99999-8888" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            
              
              {deliveryTypeValue === 'delivery' && (
                 <div className="space-y-4 p-4 border rounded-md">
                     <FormField
                        control={form.control}
                        name="customerCep"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                                <Input placeholder="Digite o CEP para buscar" {...field} onBlur={handleCepBlur} />
                            </FormControl>
                            {isFetchingCep && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Buscando endereço...</div>}
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="customerStreet"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Rua</FormLabel>
                            <FormControl>
                                <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name="customerNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: 123" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="customerComplement"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl>
                                    <Input placeholder="Apto, Bloco" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <FormField
                        control={form.control}
                        name="customerNeighborhood"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                                <Input placeholder="Bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField
                            control={form.control}
                            name="customerCity"
                            render={({ field }) => (
                                <FormItem className='sm:col-span-2'>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                    <Input placeholder="Cidade" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="customerState"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>UF</FormLabel>
                                <FormControl>
                                    <Input placeholder="SP" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                 </div>
              )}
              
              
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
                              <Input type="number" step="0.01" placeholder="0,00" {...field} disabled={deliveryTypeValue === 'pickup'}/>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                  />
              </div>

              {!fromStorefront && (
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
              )}

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
                          {!fromStorefront && (
                            <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                <RadioGroupItem value="fiado" id="fiado" />
                                </FormControl>
                                <FormLabel htmlFor="fiado" className="font-normal cursor-pointer">Venda a Prazo (Fiado)</FormLabel>
                            </FormItem>
                          )}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            </div>
          )}

        {!fromStorefront && (
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
        )}
          
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 space-y-2 space-y-reverse sm:space-y-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || isAuthLoading || isFetchingCep} className="w-full sm:w-auto">
                {(isPending || isAuthLoading || isFetchingCep) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPOSSale ? 'Finalizar Venda' : 'Adicionar Lançamento'}
              </Button>
          </div>

        </form>
      </Form>
    </>
  );
}
