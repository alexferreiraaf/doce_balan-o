'use client';
import { useTransactions } from '@/app/lib/hooks/use-transactions';
import Loading from '@/app/(main)/loading';
import { ReportCard } from './simple-report';
import { useMemo, useState } from 'react';
import { SummaryReport } from './summary-report';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export function ReportsClient() {
  const { transactions, loading } = useTransactions();
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const filteredTransactions = useMemo(() => {
    if (!date?.from || !date?.to) {
      return transactions;
    }
    // Set time to end of day for 'to' date to include all transactions on that day
    const toDate = new Date(date.to);
    toDate.setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const transactionDateMs = t.dateMs;
      if (!transactionDateMs || typeof transactionDateMs !== 'number') return false;
      return transactionDateMs >= date.from!.getTime() && transactionDateMs <= toDate.getTime();
    });
  }, [transactions, date]);


  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);


  if (loading) {
    return <Loading />;
  }
  
  const reportTitle = `Balanço de ${date?.from ? format(date.from, "LLL dd, y") : ''}${date?.to ? ` a ${format(date.to, "LLL dd, y")}`: ''}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios de Desempenho</h1>
         <div className={cn("grid gap-2")}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Selecione um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <ReportCard title={reportTitle} summary={summary} />
      
      <SummaryReport transactions={filteredTransactions} />

    </div>
  );
}
