'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, CalendarIcon } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
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
import { CurrencyInput } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { APP_ID } from '@/app/lib/constants';
import { useUser, useFirestore } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useEmployees } from '@/app/lib/hooks/use-employees';
import { AddEmployeeDialog } from './add-employee-dialog';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  employeeId: z.string({ required_error: 'Selecione um funcionário.' }),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  workedDate: z.date({ required_error: 'Selecione o dia trabalhado.' }),
  paymentMethod: z.enum(['pix', 'dinheiro', 'cartao']),
});

type EmployeePaymentFormValues = z.infer<typeof formSchema>;

interface EmployeePaymentFormProps {
    setSheetOpen: (open: boolean) => void;
}

export function EmployeePaymentForm({ setSheetOpen }: EmployeePaymentFormProps) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { employees, loading: employeesLoading } = useEmployees();

  const form = useForm<EmployeePaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'pix',
    },
  });

  const onSubmit = (data: EmployeePaymentFormValues) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado.' });
      return;
    }

    startTransition(() => {
      const employee = employees.find(e => e.id === data.employeeId);
      const employeeName = employee?.name || 'Funcionário Desconhecido';
      const formattedDate = format(data.workedDate, 'dd/MM/yyyy');
      
      const transactionDescription = `Pagamento de diária: ${employeeName} - Dia: ${formattedDate}`;
      const collectionPath = `artifacts/${APP_ID}/users/${user.uid}/transactions`;
      
      const transactionData = {
        userId: user.uid,
        type: 'expense',
        description: transactionDescription,
        category: 'Pagamento de Funcionário',
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'paid',
        dateMs: Date.now(),
        timestamp: serverTimestamp(),
      };

      const transactionCollection = collection(firestore, collectionPath);

      addDoc(transactionCollection, transactionData)
        .then(() => {
          toast({ title: 'Sucesso!', description: 'Pagamento registrado.' });
          form.reset();
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
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
                <FormItem>
                <div className="flex justify-between items-center">
                    <FormLabel>Funcionário</FormLabel>
                    <AddEmployeeDialog />
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger disabled={employeesLoading}>
                        <SelectValue placeholder={employeesLoading ? "Carregando..." : "Selecione o funcionário"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                        {e.name}
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
            name="workedDate"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Dia Trabalhado</FormLabel>
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
                                    date > new Date() || date < new Date("1900-01-01")
                                }
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
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da Diária (R$)</FormLabel>
              <FormControl>
                <CurrencyInput placeholder="R$ 0,00" {...field} onValueChange={(value) => field.onChange(value)} />
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
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-4"
                    >
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="pix" id="pix-emp" /></FormControl><FormLabel htmlFor="pix-emp" className="font-normal cursor-pointer">PIX</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="dinheiro" id="dinheiro-emp" /></FormControl><FormLabel htmlFor="dinheiro-emp" className="font-normal cursor-pointer">Dinheiro</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="cartao" id="cartao-emp" /></FormControl><FormLabel htmlFor="cartao-emp" className="font-normal cursor-pointer">Cartão</FormLabel></FormItem>
                    </RadioGroup>
                </FormControl>
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
              Registrar Pagamento
            </Button>
        </div>
      </form>
    </Form>
  );
}
