'use client';
import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, Bike, X, Plus, ChevronsUpDown } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, runTransaction, getDoc, writeBatch } from 'firebase/firestore';
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
import { Input, InputWithCopy, CepInput, PhoneInput, CurrencyInput } from '@/components/ui/input';
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
import type { Product, Transaction, Customer, Optional } from '@/app/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { Textarea } from '../ui/textarea';
import { useOptionals } from '@/app/lib/hooks/use-optionals';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useSettings } from '@/app/lib/hooks/use-settings';

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  // Fields for income type
  productId: z.string().optional(),
  quantity: z.coerce.number().optional(),
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
  fromStorefront: z.boolean().optional(),
  selectedOptionals: z.array(z.string()).optional(),
}).refine(data => {
    if (data.type === 'income' && data.hasDownPayment !== 'yes' && !data.fromStorefront) {
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
}).refine(data => {
    if (data.fromStorefront && !data.paymentMethod) {
        return false;
    }
    return true;
}, {
    message: 'Por favor, selecione a forma de pagamento.',
    path: ['paymentMethod'],
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
  const { optionals, loading: optionalsLoading } = useOptionals();
  const { settings, loading: settingsLoading } = useSettings();
  const [selectedOptionals, setSelectedOptionals] = useState<Optional[]>([]);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromStorefront,
      type: cart ? 'income' : 'expense',
      description: cart ? cart.map(item => `${item.quantity}x ${item.name}`).join(', ') : '',
      amount: cartTotal ?? 0,
      quantity: 1,
      deliveryFee: 0,
      additionalDescription: '',
      additionalValue: 0,
      hasDownPayment: 'no',
      downPayment: 0,
      category: cart ? 'Venda Online' : undefined,
      deliveryType: fromStorefront ? 'pickup' : undefined,
      customerName: '',
      customerWhatsapp: '',
      customerCep: '',
      customerStreet: '',
      customerNumber: '',
      customerComplement: '',
      customerNeighborhood: '',
      customerCity: '',
      customerState: '',
      selectedOptionals: [],
    },
  });

  const descriptionValue = form.watch('description');
  const typeValue = form.watch('type');
  const hasDownPaymentValue = form.watch('hasDownPayment');
  const deliveryTypeValue = form.watch('deliveryType');
  const customerCity = form.watch('customerCity');
  const customerState = form.watch('customerState');
  const paymentMethodValue = form.watch('paymentMethod');

  const productId = form.watch('productId');
  const quantity = form.watch('quantity');
  const deliveryFee = form.watch('deliveryFee');
  
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
    const product = products.find((p) => p.id === productId);
    const productPrice = product ? product.price : 0;
    const baseTotal = cartTotal ?? (productPrice * Number(quantity || 0));
    
    const optionalsTotal = selectedOptionals.reduce((sum, opt) => sum + opt.price, 0);
    const currentDeliveryFee = deliveryTypeValue === 'delivery' ? Number(deliveryFee || 0) : 0;
    
    const totalAmount = baseTotal + optionalsTotal + currentDeliveryFee;
    
    if (form.getValues('amount') !== totalAmount) {
        form.setValue('amount', totalAmount > 0 ? totalAmount : 0, { shouldValidate: true });
    }
    
    const optionalsDescription = selectedOptionals.map(o => o.name).join(', ');
    if (form.getValues('additionalDescription') !== optionalsDescription) {
        form.setValue('additionalDescription', optionalsDescription);
    }
    if (form.getValues('additionalValue') !== optionalsTotal) {
        form.setValue('additionalValue', optionalsTotal);
    }
  }, [productId, quantity, deliveryFee, selectedOptionals, products, cartTotal, form, deliveryTypeValue]);

  useEffect(() => {
    if (deliveryTypeValue === 'pickup') {
      form.setValue('deliveryFee', 0);
    }
  }, [deliveryTypeValue, form]);
  
  // Effect to set delivery fee based on city
  useEffect(() => {
    if (deliveryTypeValue === 'delivery') {
      const city = customerCity?.trim().toLowerCase();
      const state = customerState?.trim().toLowerCase();
      
      if (city === 'ourinhos' && state === 'sp') {
        form.setValue('deliveryFee', 10);
      } else {
        form.setValue('deliveryFee', 0);
      }
    }
  }, [customerCity, customerState, deliveryTypeValue, form]);
  
  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
        return;
    }

    setIsFetchingCep(true);
    try {
        const { data } = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`);
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
    } finally {
        setIsFetchingCep(false);
    }
  };


  const onSubmit = (data: TransactionFormValues) => {
    startTransition(async () => {
        let targetUserId: string | undefined;

        if (data.fromStorefront) {
            const storefrontUserId = process.env.NEXT_PUBLIC_STOREFRONT_USER_ID;
            if (!storefrontUserId) {
                toast({ variant: 'destructive', title: 'Erro de Configuração', description: 'O ID da loja não está configurado. Contate o suporte.' });
                console.error("NEXT_PUBLIC_STOREFRONT_USER_ID is not set in .env or .env.local");
                return;
            }
            targetUserId = storefrontUserId;
        } else {
            targetUserId = user?.uid;
        }
        
        if (!targetUserId || !firestore) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível registrar o pedido. Usuário ou conexão inválidos.' });
            return;
        }

        let customerId: string | undefined;
        let newCustomer: Customer | undefined;

        try {
             // 1. Create or find customer
            if (data.fromStorefront && data.customerName) {
                const customerCollectionPath = `artifacts/${APP_ID}/customers`;
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
                
                const customerCollection = collection(firestore, customerCollectionPath);
                const docRef = await addDoc(customerCollection, customerData);
                customerId = docRef.id;
                newCustomer = { id: customerId, ...customerData };
            }
            
            // 2. Prepare transaction data
            let transactionDescription = data.description || '';
            const downPaymentValue = data.hasDownPayment === 'yes' ? (data.downPayment || 0) : 0;

            let productsInSale: {id: string, quantity: number}[] = [];

            if (data.type === 'income' && !cart) {
                const product = products.find(p => p.id === data.productId);
                if (!product || !data.quantity) {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um produto e quantidade.' });
                    return;
                }
                transactionDescription = `Venda de ${data.quantity}x ${product.name}`;
                productsInSale.push({id: product.id, quantity: data.quantity});
            } else if (data.type === 'income' && cart) {
                transactionDescription = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
                productsInSale = cart.map(item => ({id: item.id, quantity: item.quantity}));
            } else {
                transactionDescription = data.description || 'Despesa sem descrição';
            }

            if (selectedOptionals.length > 0) {
                transactionDescription += ` (+ ${selectedOptionals.map(o => o.name).join(', ')})`;
            }

            if (downPaymentValue > 0) {
                transactionDescription += ` (Entrada de ${formatCurrency(downPaymentValue)})`;
            }
            
            if (data.fromStorefront && data.deliveryType) {
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

            if (data.fromStorefront) {
                status = 'pending';
            }

            const transactionCollectionPath = `artifacts/${APP_ID}/users/${targetUserId}/transactions`;
            
            const transactionData: Omit<Transaction, 'id' | 'timestamp'> = {
                userId: targetUserId,
                type: data.type,
                description: transactionDescription,
                category: data.fromStorefront ? 'Venda Online' : data.category,
                amount: data.amount,
                discount: 0,
                deliveryFee: data.deliveryType === 'delivery' ? (data.deliveryFee || 0) : 0,
                additionalDescription: selectedOptionals.map(o => o.name).join(', ') || '',
                additionalValue: selectedOptionals.reduce((sum, opt) => sum + opt.price, 0),
                downPayment: downPaymentValue,
                paymentMethod: paymentMethod,
                status: status,
                customerId: customerId,
                dateMs: Date.now(),
            };
            
            // 3. Create transaction and update product sales counts in a batch
            const batch = writeBatch(firestore);
            
            // Add new transaction to the batch
            const transactionCollection = collection(firestore, transactionCollectionPath);
            const finalTransactionData = { ...transactionData, timestamp: serverTimestamp() };
            const newTransactionRef = doc(transactionCollection);
            batch.set(newTransactionRef, finalTransactionData);
            
            // Update sales count for each product in the sale
            if (productsInSale.length > 0) {
                for (const item of productsInSale) {
                    const productRef = doc(firestore, `artifacts/${APP_ID}/products`, item.id);
                    const productDoc = await getDoc(productRef);
                    if (productDoc.exists()) {
                        const currentSales = productDoc.data().salesCount || 0;
                        batch.update(productRef, { salesCount: currentSales + item.quantity });
                    }
                }
            }

            // Commit the batch
            await batch.commit();
            
            toast({ title: 'Sucesso!', description: data.fromStorefront ? 'Pedido enviado!' : 'Lançamento adicionado.' });
            
            if (data.type === 'income' && onSaleFinalized) {
                const createdTransaction: Transaction = {
                    ...transactionData,
                    id: newTransactionRef.id,
                    timestamp: {
                      toDate: () => new Date(),
                      toMillis: () => Date.now(),
                      nanoseconds: 0,
                      seconds: Math.floor(Date.now() / 1000)
                    },
                  };
                onSaleFinalized(createdTransaction, newCustomer);
            }

            form.reset({type: data.type, description: '', amount: 0, quantity: 1, deliveryFee: 0, additionalDescription: '', additionalValue: 0, hasDownPayment: 'no', downPayment: 0, deliveryType: data.fromStorefront ? 'pickup' : undefined});
            setSelectedOptionals([]);
            setSheetOpen(false);

        } catch (error) {
            console.error('Error in onSubmit:', error);
             toast({ variant: 'destructive', title: 'Erro Crítico', description: 'Não foi possível completar a operação. Verifique suas permissões.' });
             errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'customer/transaction creation',
                operation: 'create',
                requestResourceData: {data},
            }));
        }
    });
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    form.reset();
    form.setValue('type', newType);
    form.setValue('quantity', 1);
    form.setValue('deliveryFee', 0);
    form.setValue('additionalDescription', '');
    form.setValue('additionalValue', 0);
    form.setValue('hasDownPayment', 'no');
    form.setValue('downPayment', 0);
    setSuggestions([]);
    setSelectedOptionals([]);
  };

  const handleOptionalToggle = (optional: Optional) => {
    setSelectedOptionals(prev => {
        const isSelected = prev.some(o => o.id === optional.id);
        if (isSelected) {
            return prev.filter(o => o.id !== optional.id);
        } else {
            return [...prev, optional];
        }
    });
  }

  const isPOSSale = !!cart;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!isPOSSale && !fromStorefront && (
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
                      <CurrencyInput placeholder="R$ 0,00" {...field} onValueChange={(value) => field.onChange(value)} />
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
              {!isPOSSale && !fromStorefront && (
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
              {(isPOSSale || fromStorefront) && (
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
              
              {fromStorefront && (
                <div className='space-y-4'>
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
                              <PhoneInput placeholder="(11) 99999-8888" {...field} onValueChange={(value) => field.onChange(value)} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              )}
            
              
              {deliveryTypeValue === 'delivery' && (
                 <div className="space-y-4 p-4 border rounded-md">
                     <FormField
                        control={form.control}
                        name="customerCep"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <CepInput placeholder="Digite o CEP para buscar" {...field} onBlur={(e) => handleCepBlur(e.target.value)} onValueChange={(value) => field.onChange(value)} />
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
              
              
              <div className="space-y-2">
                <FormLabel>Opcionais</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                        >
                            <span className="truncate">
                                {selectedOptionals.length > 0 ? selectedOptionals.map(o => o.name).join(', ') : "Selecione os opcionais..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                         {optionalsLoading ? (
                            <p className="text-sm text-center text-muted-foreground p-4">Carregando opcionais...</p>
                        ) : (
                            <ScrollArea className="max-h-60">
                                <div className="p-4 space-y-2">
                                {optionals.map(opt => (
                                     <div key={opt.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={opt.id}
                                            checked={selectedOptionals.some(o => o.id === opt.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedOptionals(prev => [...prev, opt]);
                                                } else {
                                                    setSelectedOptionals(prev => prev.filter(o => o.id !== opt.id));
                                                }
                                            }}
                                        />
                                        <label
                                            htmlFor={opt.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex justify-between w-full"
                                        >
                                            <span>{opt.name}</span>
                                            <span className='text-muted-foreground'>{formatCurrency(opt.price)}</span>
                                        </label>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                    </PopoverContent>
                </Popover>
                 <FormMessage />
              </div>
              
              
              {deliveryTypeValue === 'delivery' && (
                <FormField
                    control={form.control}
                    name="deliveryFee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Taxa de Entrega (R$)</FormLabel>
                        <FormControl>
                          <CurrencyInput placeholder="R$ 0,00" {...field} onValueChange={(value) => field.onChange(value)} />
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
                      <Input type="text" value={formatCurrency(field.value)} readOnly className="bg-muted font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {fromStorefront ? (
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
                              <RadioGroupItem value="pix" id="pix-store" />
                            </FormControl>
                            <FormLabel htmlFor="pix-store" className="font-normal cursor-pointer">PIX</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="dinheiro" id="dinheiro-store" />
                            </FormControl>
                            <FormLabel htmlFor="dinheiro-store" className="font-normal cursor-pointer">Dinheiro (na entrega)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="cartao" id="cartao-store" />
                            </FormControl>
                            <FormLabel htmlFor="cartao-store" className="font-normal cursor-pointer">Cartão (na entrega)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : ( // Admin Panel Payment Options
                <>
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

                  {hasDownPaymentValue === 'yes' ? (
                      <FormField
                          control={form.control}
                          name="downPayment"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>Valor de Entrada (R$)</FormLabel>
                              <FormControl>
                                <CurrencyInput placeholder="R$ 0,00" {...field} onValueChange={(value) => field.onChange(value)} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  ) : (
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
                                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="pix" id="pix" /></FormControl><FormLabel htmlFor="pix" className="font-normal cursor-pointer">PIX</FormLabel></FormItem>
                                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dinheiro" id="dinheiro" /></FormControl><FormLabel htmlFor="dinheiro" className="font-normal cursor-pointer">Dinheiro</FormLabel></FormItem>
                                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cartao" id="cartao" /></FormControl><FormLabel htmlFor="cartao" className="font-normal cursor-pointer">Cartão</FormLabel></FormItem>
                                      <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="fiado" id="fiado" /></FormControl><FormLabel htmlFor="fiado" className="font-normal cursor-pointer">Venda a Prazo (Fiado)</FormLabel></FormItem>
                                  </RadioGroup>
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                      />
                  )}
                </>
              )}
                {fromStorefront && paymentMethodValue === 'pix' && (
                    <div className="space-y-2 pt-2">
                        <FormLabel>Pagamento via PIX</FormLabel>
                        {settingsLoading ? (
                             <p className="text-sm text-muted-foreground">Carregando chave PIX...</p>
                        ) : settings?.pixKey ? (
                            <>
                            <p className="text-sm text-muted-foreground">
                                Use a chave abaixo para fazer o pagamento e envie o comprovante para nosso WhatsApp.
                            </p>
                            <InputWithCopy value={settings.pixKey} />
                            </>
                        ) : (
                            <p className="text-sm text-amber-700 bg-amber-100 p-3 rounded-md">
                                A chave PIX não foi configurada pelo administrador da loja. Por favor, entre em contato para combinar o pagamento.
                            </p>
                        )}
                    </div>
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
              <Button type="submit" disabled={isPending || isAuthLoading || isFetchingCep || (fromStorefront && paymentMethodValue === 'pix' && !settings?.pixKey) } className="w-full sm:w-auto">
                {(isPending || isAuthLoading || isFetchingCep) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPOSSale || fromStorefront ? 'Finalizar Venda' : 'Adicionar Lançamento'}
              </Button>
          </div>

        </form>
      </Form>
    </>
  );
}
