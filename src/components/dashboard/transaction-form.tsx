'use client';
import { useState, useTransition, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, Bike, X, Plus, ChevronsUpDown, Minus, ChevronDown, CalendarIcon } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc, writeBatch, Timestamp, runTransaction } from 'firebase/firestore';
import axios from 'axios';
import { addDays, format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
import { AddProductDialog } from '../products/add-product-dialog';
import { formatCurrency, cn } from '@/lib/utils';
import type { Product, Transaction, Customer, Optional, SelectedOptional, CartItem } from '@/app/lib/types';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useCustomers } from '@/app/lib/hooks/use-customers';
import { Textarea } from '../ui/textarea';
import { useOptionals } from '@/app/lib/hooks/use-optionals';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useSettings } from '@/app/lib/hooks/use-settings';
import { storefrontUserId } from '@/firebase/config';
import { Separator } from '../ui/separator';
import { Card } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Calendar } from '../ui/calendar';
import { AddCustomerDialog } from './add-customer-dialog';


const selectedOptionalSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  selectedOptionals: z.array(selectedOptionalSchema).optional(),
});

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().optional(),
  category: z.string({ required_error: 'Por favor, selecione uma categoria.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  // Fields for income type
  productId: z.string().optional(),
  quantity: z.coerce.number().optional(),
  deliveryFee: z.coerce.number().optional(),
  discount: z.coerce.number().optional(),
  additionalDescription: z.string().optional(),
  additionalValue: z.coerce.number().optional(),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao', 'fiado']).optional(),
  
  // Storefront / Customer fields
  deliveryType: z.enum(['delivery', 'pickup']).optional(),
  customerId: z.string().optional(),
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
  selectedOptionals: z.array(selectedOptionalSchema).optional(),
  cartItems: z.array(cartItemSchema).optional(),

  // Installments / Credit Card
  isInstallment: z.boolean().optional(),
  totalInstallments: z.coerce.number().optional(),
  creditCard: z.string().optional(),

  // Scheduling fields
  scheduledDate: z.date().optional(),
  scheduledTime: z.string().optional(),

  // Custom Transaction Date
  transactionDate: z.date({ required_error: 'Por favor, selecione uma data.' }).optional(),

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
    if (data.fromStorefront && !data.customerWhatsapp) {
        return false;
    }
    return true;
}, {
    message: 'O WhatsApp é obrigatório.',
    path: ['customerWhatsapp'],
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
}).refine(data => {
    if (data.fromStorefront && !data.scheduledDate) {
        return false;
    }
    return true;
}, {
    message: 'Por favor, selecione uma data.',
    path: ['scheduledDate'],
}).refine(data => {
    if (data.fromStorefront && data.scheduledDate && !data.scheduledTime) {
        return false;
    }
    return true;
}, {
    message: 'Por favor, selecione um horário.',
    path: ['scheduledTime'],
});


type TransactionFormValues = z.infer<typeof formSchema> & { fromStorefront?: boolean };

interface InitialCartItem extends Product {
  quantity: number;
  selectedOptionals?: SelectedOptional[];
}

interface TransactionFormProps {
    setSheetOpen: (open: boolean) => void;
    onSaleFinalized?: (transaction: Transaction, customer?: Customer) => void;
    cart?: InitialCartItem[];
    cartTotal?: number;
    fromStorefront?: boolean;
}

const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    // Check for the next 60 days
    for (let i = 0; i < 60; i++) {
        const date = addDays(today, i);
        const dayOfWeek = getDay(date); // 0 (Sun) to 6 (Sat)
        if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
            dates.push(date);
        }
    }
    return dates;
};

const availableTimeSlots = [
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

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
  const { customers, loading: customersLoading } = useCustomers(fromStorefront);
  const { optionals, loading: optionalsLoading } = useOptionals();
  const { settings, loading: settingsLoading } = useSettings();
  const [selectedOptionals, setSelectedOptionals] = useState<SelectedOptional[]>([]);
  
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isClient, setIsClient] = useState(false);
  const isPOSSale = !!cart;

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setAvailableDates(getAvailableDates());
    }
    setIsClient(true);
  }, []);


  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromStorefront,
      type: cart ? 'income' : 'expense',
      description: cart ? cart.map(item => `${item.quantity}x ${item.name}`).join(', ') : '',
      amount: cartTotal ?? 0,
      quantity: 1,
      deliveryFee: 0,
      discount: 0,
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
      cartItems: cart || [],
      isInstallment: false,
      totalInstallments: undefined,
      creditCard: '',
      transactionDate: new Date(),
    },
  });

  const descriptionValue = form.watch('description');
  const typeValue = form.watch('type');
  const hasDownPaymentValue = form.watch('hasDownPayment');
  const deliveryTypeValue = form.watch('deliveryType');
  const customerCity = form.watch('customerCity');
  const customerState = form.watch('customerState');
  const paymentMethodValue = form.watch('paymentMethod');
  const scheduledDateValue = form.watch('scheduledDate');

  const productId = form.watch('productId');
  const quantity = form.watch('quantity');
  const deliveryFee = form.watch('deliveryFee');
  const discount = form.watch('discount');
  const cartItemsValue = form.watch('cartItems');
  
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
    
    const cartItems = cartItemsValue || [];
    const baseTotal = cartTotal ?? (productPrice * Number(quantity || 0));
    
    // Calculate optionals total from all sources
    let optionalsTotal = 0;
    if (isPOSSale || fromStorefront) {
      optionalsTotal = cartItems.reduce((acc, item) => {
        const itemOptionalsTotal = (item.selectedOptionals || []).reduce((optAcc, opt) => optAcc + (opt.price * opt.quantity), 0);
        return acc + itemOptionalsTotal;
      }, 0);
    } else {
      optionalsTotal = selectedOptionals.reduce((sum, opt) => sum + (opt.price * opt.quantity), 0);
    }

    const currentDeliveryFee = deliveryTypeValue === 'delivery' ? Number(deliveryFee || 0) : 0;
    const currentDiscount = Number(discount || 0);
    
    const totalAmount = baseTotal + optionalsTotal + currentDeliveryFee - currentDiscount;
    
    if (form.getValues('amount') !== totalAmount) {
        form.setValue('amount', totalAmount > 0 ? totalAmount : 0, { shouldValidate: true });
    }
    
    let optionalsDescription = '';
    if (isPOSSale || fromStorefront) {
      optionalsDescription = cartItems
        .filter(item => item.selectedOptionals && item.selectedOptionals.length > 0)
        .map(item => `${item.name}: ${item.selectedOptionals!.map(o => `${o.quantity}x ${o.name}`).join(', ')}`)
        .join('; ');
    } else {
      optionalsDescription = selectedOptionals
        .map(o => `${o.quantity}x ${o.name}`)
        .join(', ');
    }

    if (form.getValues('additionalDescription') !== optionalsDescription) {
        form.setValue('additionalDescription', optionalsDescription);
    }
    if (form.getValues('additionalValue') !== optionalsTotal) {
        form.setValue('additionalValue', optionalsTotal);
    }
    if (JSON.stringify(form.getValues('selectedOptionals')) !== JSON.stringify(selectedOptionals)) {
      form.setValue('selectedOptionals', selectedOptionals);
    }
  }, [productId, quantity, deliveryTypeValue, deliveryFee, discount, selectedOptionals, products, cartTotal, form, isPOSSale, fromStorefront, cartItemsValue]);

  useEffect(() => {
    if (deliveryTypeValue === 'pickup') {
      form.setValue('deliveryFee', 0);
    }
  }, [deliveryTypeValue, form]);
  
  // Effect to set delivery fee based on city
  useEffect(() => {
    if (fromStorefront && deliveryTypeValue === 'delivery') {
      const city = customerCity?.trim().toLowerCase();
      const state = customerState?.trim().toLowerCase();
      
      if (city === 'ourinhos' && state === 'sp') {
        form.setValue('deliveryFee', 10);
      } else {
        form.setValue('deliveryFee', 0);
      }
    }
  }, [customerCity, customerState, deliveryTypeValue, form, fromStorefront]);
  
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

        let customerId: string | undefined = data.customerId;
        let customerForReceipt: Customer | undefined;

        try {
            // 1. Find or Create/Update customer for storefront sales
            if (data.fromStorefront && data.customerName) {
                const customerData: Partial<Customer> = {
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
                
                customerForReceipt = customerData as Customer;
            } else if (data.customerId) {
                customerForReceipt = customers.find(c => c.id === data.customerId);
            }
            
            // 2. Prepare transaction data
            let transactionDescription = data.description || '';
            const downPaymentValue = data.hasDownPayment === 'yes' ? (data.downPayment || 0) : 0;
            let scheduledAtTimestamp: Timestamp | undefined;
            
            if ((isPOSSale || data.fromStorefront) && data.scheduledDate && data.scheduledTime) {
                const [hours, minutes] = data.scheduledTime.split(':').map(Number);
                const scheduledDateWithTime = new Date(data.scheduledDate);
                scheduledDateWithTime.setHours(hours, minutes, 0, 0);
                scheduledAtTimestamp = Timestamp.fromDate(scheduledDateWithTime);
                transactionDescription += ` (Agendado para ${format(scheduledDateWithTime, "dd/MM 'às' HH:mm")})`;
            }

            let cartItems: CartItem[] = [];
            let productsInSale: {id: string, quantity: number}[] = [];

            if (data.type === 'income' && !cart) {
                const product = products.find(p => p.id === data.productId);
                if (!product || !data.quantity) {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Selecione um produto e quantidade.' });
                    return;
                }
                transactionDescription = `Venda de ${data.quantity}x ${product.name}`;
                productsInSale.push({id: product.id, quantity: data.quantity});
                cartItems.push({id: product.id, name: product.name, price: product.price, quantity: data.quantity});
            } else if (data.type === 'income' && (cart || data.cartItems)) {
                const currentCartItems = data.cartItems || cart || [];
                transactionDescription = currentCartItems.map(item => {
                  let itemDesc = `${item.quantity}x ${item.name}`;
                  if (item.selectedOptionals && item.selectedOptionals.length > 0) {
                    itemDesc += ` (Opcionais: ${item.selectedOptionals.map(o => `${o.quantity}x ${o.name}`).join(', ')})`;
                  }
                  return itemDesc;
                }).join(', ');
                productsInSale = currentCartItems.map(item => ({id: item.id, quantity: item.quantity}));
                cartItems = currentCartItems;
            } else {
                transactionDescription = data.description || 'Despesa sem descrição';
            }

            if (selectedOptionals.length > 0 && !data.fromStorefront && !isPOSSale) {
                 transactionDescription += ` (+ ${selectedOptionals.map(o => `${o.quantity}x ${o.name}`).join(', ')})`;
            }

            if (downPaymentValue > 0) {
                transactionDescription += ` (Entrada de ${formatCurrency(downPaymentValue)})`;
            }
            
            if (data.deliveryType) {
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
            
            const transactionData: Partial<Omit<Transaction, 'id' | 'timestamp'>> = {
                userId: targetUserId,
                type: data.type,
                description: transactionDescription,
                category: data.fromStorefront ? 'Venda Online' : data.category,
                amount: data.amount,
                discount: data.discount || 0,
                deliveryFee: data.deliveryType === 'delivery' ? (data.deliveryFee || 0) : 0,
                additionalDescription: data.additionalDescription || '',
                additionalValue: data.additionalValue || 0,
                selectedOptionals: data.selectedOptionals || [],
                cartItems: cartItems,
                downPayment: downPaymentValue,
                paymentMethod: paymentMethod,
                status: status,
                customerId: customerId || undefined,
                dateMs: data.transactionDate ? data.transactionDate.getTime() : Date.now(),
                deliveryType: data.deliveryType,
                customerInfo: data.fromStorefront && customerForReceipt ? customerForReceipt : undefined,
            };
            
            if (scheduledAtTimestamp) {
                transactionData.scheduledAt = scheduledAtTimestamp;
            }

            // 3. Create transaction and update product sales counts
            const transactionCollection = collection(firestore, transactionCollectionPath);
            const newTransactionRef = doc(transactionCollection);
            let finalOrderNumber: number | undefined;

            await runTransaction(firestore, async (firestoreTransaction) => {
                // 1. ALL READS FIRST
                
                // Read counter
                const counterRef = doc(firestore, `artifacts/${APP_ID}/settings`, 'counters');
                const counterDoc = await firestoreTransaction.get(counterRef);
                
                // Read all products involved
                const productDocs: { ref: any, currentSales: number, quantity: number }[] = [];
                if (productsInSale.length > 0) {
                    for (const item of productsInSale) {
                        const productRef = doc(firestore, `artifacts/${APP_ID}/products`, item.id);
                        const productDoc = await firestoreTransaction.get(productRef);
                        if (productDoc.exists()) {
                            productDocs.push({
                                ref: productRef,
                                currentSales: productDoc.data().salesCount || 0,
                                quantity: item.quantity
                            });
                        }
                    }
                }

                // 2. ALL WRITES AFTER
                
                // Increment counter
                let nextNumber = 1;
                if (counterDoc.exists()) {
                    nextNumber = (counterDoc.data().orderSequence || 0) + 1;
                }
                firestoreTransaction.set(counterRef, { orderSequence: nextNumber }, { merge: true });
                finalOrderNumber = nextNumber;

                const isInstallmentExpense = data.type === 'expense' && data.paymentMethod === 'cartao' && data.isInstallment && data.totalInstallments && data.totalInstallments > 1;

                if (isInstallmentExpense) {
                    const totalInstallments = data.totalInstallments!;
                    const installmentAmount = data.amount / totalInstallments;
                    const purchaseGroupId = doc(transactionCollection).id;
                    const baseDate = data.transactionDate || new Date();

                    for (let i = 1; i <= totalInstallments; i++) {
                        const installmentDate = new Date(baseDate);
                        installmentDate.setMonth(baseDate.getMonth() + (i - 1));
                        
                        const finalTransactionData: any = { 
                            ...transactionData,
                            amount: installmentAmount,
                            timestamp: Timestamp.fromDate(installmentDate),
                            dateMs: installmentDate.getTime(),
                            orderNumber: finalOrderNumber,
                            isInstallment: true,
                            installmentIndex: i,
                            totalInstallments: totalInstallments,
                            purchaseGroupId: purchaseGroupId,
                            creditCard: data.creditCard || '',
                            description: `${transactionData.description} (Parcela ${i}/${totalInstallments})`
                        };

                        Object.keys(finalTransactionData).forEach(key => {
                            if (finalTransactionData[key] === undefined) {
                                delete finalTransactionData[key];
                            }
                        });

                        const installmentRef = doc(transactionCollection);
                        firestoreTransaction.set(installmentRef, finalTransactionData);
                    }
                } else {
                    // Prepare final data
                    const finalTransactionData: any = { 
                        ...transactionData, 
                        timestamp: data.transactionDate ? Timestamp.fromDate(data.transactionDate) : serverTimestamp(),
                        orderNumber: finalOrderNumber 
                    };
                    Object.keys(finalTransactionData).forEach(key => {
                        if (finalTransactionData[key] === undefined) {
                            delete finalTransactionData[key];
                        }
                    });

                    // Create transaction
                    firestoreTransaction.set(newTransactionRef, finalTransactionData);
                }

                // Update sales counts
                for (const p of productDocs) {
                    firestoreTransaction.update(p.ref, { salesCount: p.currentSales + p.quantity });
                }
            });
            
            toast({ title: 'Sucesso!', description: data.fromStorefront ? 'Pedido enviado!' : 'Lançamento adicionado.' });
            
            if (data.fromStorefront && targetUserId) {
                fetch('/api/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: '🛒 Novo Pedido Online!',
                        message: `Pedido de ${formatCurrency(data.amount)} recebido de ${data.customerName || 'Cliente'}.`,
                        userId: targetUserId,
                        url: '/transactions'
                    })
                }).catch(err => console.error('Failed to send push notification:', err));
            }
            
            if (data.type === 'income' && onSaleFinalized) {
                const createdTransaction: Transaction = {
                    ...(transactionData as Omit<Transaction, 'id' | 'timestamp' | 'customerId'>),
                    id: newTransactionRef.id,
                    orderNumber: finalOrderNumber,
                    customerId: customerId || undefined,
                    timestamp: Timestamp.fromDate(new Date()),
                  };
                onSaleFinalized(createdTransaction, customerForReceipt);
            }

            form.reset({type: data.type, description: '', amount: 0, quantity: 1, deliveryFee: 0, discount: 0, additionalDescription: '', additionalValue: 0, hasDownPayment: 'no', downPayment: 0, deliveryType: data.fromStorefront ? 'pickup' : undefined});
            setSelectedOptionals([]);
            setSheetOpen(false);

        } catch (error: any) {
            console.error('Error in onSubmit:', error);
            if (error?.code === 'permission-denied') {
                 toast({ variant: 'destructive', title: 'Erro de Permissão', description: 'Você não tem permissão para realizar esta operação.' });
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: 'customer/transaction creation',
                    operation: 'create',
                    requestResourceData: {data},
                }));
            } else {
                 toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao processar o pedido. Tente novamente.' });
            }
        }
    });
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    form.reset();
    form.setValue('type', newType);
    form.setValue('quantity', 1);
    form.setValue('deliveryFee', 0);
    form.setValue('discount', 0);
    form.setValue('additionalDescription', '');
    form.setValue('additionalValue', 0);
    form.setValue('hasDownPayment', 'no');
    form.setValue('downPayment', 0);
    setSuggestions([]);
    setSelectedOptionals([]);
  };

  const handleOptionalQuantityChange = (optional: Optional, change: 1 | -1) => {
    setSelectedOptionals(prev => {
        const existing = prev.find(o => o.id === optional.id);
        if (existing) {
            const newQuantity = existing.quantity + change;
            if (newQuantity <= 0) {
                return prev.filter(o => o.id !== optional.id);
            }
            return prev.map(o => o.id === optional.id ? { ...o, quantity: newQuantity } : o);
        } else if (change === 1) {
            return [...prev, { ...optional, quantity: 1 }];
        }
        return prev;
    });
  }

  const handleItemOptionalQuantityChange = (itemIndex: number, optional: Optional, change: 1 | -1) => {
    const currentCartItems = [...(form.getValues('cartItems') || [])];
    const item = currentCartItems[itemIndex];
    if (!item) return;

    const currentOptionals = [...(item.selectedOptionals || [])];
    const existing = currentOptionals.find(o => o.id === optional.id);

    if (existing) {
        const newQuantity = existing.quantity + change;
        if (newQuantity <= 0) {
            item.selectedOptionals = currentOptionals.filter(o => o.id !== optional.id);
        } else {
            item.selectedOptionals = currentOptionals.map(o => o.id === optional.id ? { ...o, quantity: newQuantity } : o);
        }
    } else if (change === 1) {
        item.selectedOptionals = [...currentOptionals, { ...optional, quantity: 1 }];
    }

    form.setValue('cartItems', currentCartItems, { shouldValidate: true });
  }

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
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                  <FormLabel>Meio de Pagamento</FormLabel>
                  <FormControl>
                      <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                      >
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="pix" id="exp-pix" /></FormControl><FormLabel htmlFor="exp-pix" className="font-normal cursor-pointer">PIX</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dinheiro" id="exp-dinheiro" /></FormControl><FormLabel htmlFor="exp-dinheiro" className="font-normal cursor-pointer">Dinheiro</FormLabel></FormItem>
                          <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cartao" id="exp-cartao" /></FormControl><FormLabel htmlFor="exp-cartao" className="font-normal cursor-pointer">Cartão de Crédito</FormLabel></FormItem>
                      </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
              />
              {paymentMethodValue === 'cartao' && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <FormField
                    control={form.control}
                    name="creditCard"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual Cartão?</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Nubank, Itaú..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isInstallment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Compra Parcelada?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  {form.watch('isInstallment') && (
                    <FormField
                      control={form.control}
                      name="totalInstallments"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Parcelas</FormLabel>
                          <FormControl>
                            <Input type="number" min="2" max="36" step="1" {...field} value={field.value || ''} />
                          </FormControl>
                          {Number(field.value) > 1 && Number(form.watch('amount')) > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-2">
                              Serão geradas {field.value} parcelas de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(form.watch('amount')) / Number(field.value))}
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
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
              
              {fromStorefront ? (
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
                              <PhoneInput placeholder="(11) 99999-8888" {...field} onValueChange={(value) => {
                                  field.onChange(value);
                                  const cleanPhone = value.replace(/\D/g, '');
                                  if (cleanPhone.length >= 10) {
                                      const existing = customers.find(c => c.whatsapp && c.whatsapp.replace(/\D/g, '') === cleanPhone);
                                      if (existing) {
                                          if (!form.getValues('customerName')) form.setValue('customerName', existing.name);
                                          if (!form.getValues('customerCep') && existing.cep) {
                                              form.setValue('customerCep', existing.cep);
                                              form.setValue('customerStreet', existing.street || '');
                                              form.setValue('customerNumber', existing.number || '');
                                              form.setValue('customerComplement', existing.complement || '');
                                              form.setValue('customerNeighborhood', existing.neighborhood || '');
                                              form.setValue('customerCity', existing.city || '');
                                              form.setValue('customerState', existing.state || '');
                                          }
                                      }
                                  }
                              }} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              ): (
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                        <div className="flex justify-between items-center">
                            <FormLabel>Cliente</FormLabel>
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
              )}
            
              
              {deliveryTypeValue === 'delivery' && (
                 <div className="space-y-4 p-4 border rounded-md">
                    {!fromStorefront ? (
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
                    ) : (
                        <>
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
                                <FormField
                                    control={form.control}
                                    name="deliveryFee"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Taxa de Entrega (R$)</FormLabel>
                                        <FormControl>
                                        <CurrencyInput placeholder="R$ 0,00" {...field} onValueChange={(value) => field.onChange(value)} readOnly={fromStorefront} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                 </div>
              )}
              
                {(isPOSSale || fromStorefront) && isClient && (
                <div className="space-y-4 pt-2">
                    <Separator />
                    <FormLabel>Agendamento</FormLabel>
                     <p className="text-sm text-muted-foreground">
                        Selecione a data e hora para a retirada ou entrega do seu pedido. Atendemos sextas e sábados das 12:00 às 18:00.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="scheduledDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP", { locale: ptBR })
                                                    ) : (
                                                        <span>Escolha uma data</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    !availableDates.some(
                                                        (availableDate) =>
                                                            date.getFullYear() === availableDate.getFullYear() &&
                                                            date.getMonth() === availableDate.getMonth() &&
                                                            date.getDate() === availableDate.getDate()
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {scheduledDateValue && (
                            <FormField
                                control={form.control}
                                name="scheduledTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Horário</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o horário" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableTimeSlots.map(slot => (
                                                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>
              )}
              
              <Collapsible className="space-y-2" defaultOpen>
                <CollapsibleTrigger className="flex justify-between items-center w-full pt-2">
                  <FormLabel>Opcionais</FormLabel>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="p-4">
                      {optionalsLoading ? (
                          <p className="text-sm text-center text-muted-foreground">Carregando opcionais...</p>
                      ) : optionals.length === 0 ? (
                          <p className="text-sm text-center text-muted-foreground">Nenhum opcional cadastrado.</p>
                      ) : (
                          <div className="space-y-6">
                              {isPOSSale || fromStorefront ? (
                                (form.watch('cartItems') || []).map((item, itemIdx) => (
                                  <div key={`${item.id}-${itemIdx}`} className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {item.quantity}x {item.name}
                                      </Badge>
                                      <div className="h-px flex-1 bg-border" />
                                    </div>
                                    <div className="space-y-2 pl-2">
                                      {optionals.map(opt => {
                                          const selected = (item.selectedOptionals || []).find(s => s.id === opt.id);
                                          return (
                                              <div key={opt.id} className="flex items-center justify-between">
                                                  <div>
                                                      <p className="text-sm font-medium">{opt.name}</p>
                                                      <p className="text-[10px] text-muted-foreground">{formatCurrency(opt.price)}</p>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                      <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleItemOptionalQuantityChange(itemIdx, opt, -1)}>
                                                          <Minus className="h-3 h-3" />
                                                      </Button>
                                                      <span className="font-bold text-sm w-4 text-center">{selected?.quantity || 0}</span>
                                                      <Button type="button" variant="outline" size="icon" className="h-6 w-6" onClick={() => handleItemOptionalQuantityChange(itemIdx, opt, 1)}>
                                                          <Plus className="h-3 h-3" />
                                                      </Button>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="space-y-3">
                                  {optionals.map(opt => {
                                      const selected = selectedOptionals.find(s => s.id === opt.id);
                                      return (
                                          <div key={opt.id} className="flex items-center justify-between">
                                              <div>
                                                  <p className="font-medium">{opt.name}</p>
                                                  <p className="text-xs text-muted-foreground">{formatCurrency(opt.price)}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOptionalQuantityChange(opt, -1)}>
                                                      <Minus className="h-4 w-4" />
                                                  </Button>
                                                  <span className="font-bold text-lg w-5 text-center">{selected?.quantity || 0}</span>
                                                  <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOptionalQuantityChange(opt, 1)}>
                                                      <Plus className="h-4 w-4" />
                                                  </Button>
                                              </div>
                                          </div>
                                      );
                                  })}
                                </div>
                              )}
                          </div>
                      )}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
              
              {!fromStorefront && (
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Desconto (R$)</FormLabel>
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
          <>
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
          </>
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
