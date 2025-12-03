'use client';
import { useMemo } from 'react';
import type { Transaction } from '@/app/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock, Banknote } from 'lucide-react';

interface SummaryReportProps {
  transactions: Transaction[];
}

interface CategorySummary {
  name: string;
  total: number;
}

export function SummaryReport({ transactions }: SummaryReportProps) {
  const summary = useMemo(() => {
    const paidIncome = transactions.filter(t => t.type === 'income' && t.status === 'paid');
    const expenses = transactions.filter(t => t.type === 'expense');
    const pending = transactions.filter(t => t.status === 'pending');

    const totalIncome = paidIncome.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const groupByCategory = (trans: Transaction[]) => {
      return trans.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    };

    const incomeByCategory = groupByCategory(paidIncome);
    const expenseByCategory = groupByCategory(expenses);

    const topIncomeCategories = Object.entries(incomeByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    const topExpenseCategories = Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, total]) => ({ name, total }));

    return {
      balance,
      totalPending,
      topIncomeCategories,
      topExpenseCategories,
    };
  }, [transactions]);

  const SummaryList = ({ title, items, icon: Icon, colorClass }: { title: string; items: CategorySummary[], icon: React.ElementType, colorClass: string }) => {
    return (
        <div>
            <h3 className={`text-lg font-semibold flex items-center gap-2 mb-2 ${colorClass}`}>
                <Icon className="w-5 h-5" />
                {title}
            </h3>
            {items.length > 0 ? (
                <ul className="space-y-1">
                {items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm text-muted-foreground">
                    <span>{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">Nenhuma categoria para exibir.</p>
            )}
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Geral do Período</CardTitle>
        <CardDescription>Uma visão geral da saúde financeira do seu negócio com base em todos os seus lançamentos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className={`p-4 rounded-lg text-center ${summary.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="text-sm font-medium text-muted-foreground">Balanço Final (Receitas Pagas - Despesas)</h3>
                <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(summary.balance)}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-100 text-center">
                <h3 className="text-sm font-medium text-amber-800 flex items-center justify-center gap-2"><Clock className="w-4 h-4"/>Vendas a Prazo (Pendentes)</h3>
                <p className="text-3xl font-bold text-amber-700">{formatCurrency(summary.totalPending)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SummaryList title="Principais Fontes de Receita" items={summary.topIncomeCategories} icon={TrendingUp} colorClass="text-green-600" />
            <SummaryList title="Principais Categorias de Despesa" items={summary.topExpenseCategories} icon={TrendingDown} colorClass="text-red-600" />
        </div>
      </CardContent>
    </Card>
  );
}
