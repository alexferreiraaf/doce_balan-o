'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ReportCardProps {
  title: string;
  summary: { income: number; expense: number; cost: number; grossProfit: number; balance: number };
}

export const ReportCard = ({ title, summary }: ReportCardProps) => {
  const [showValues, setShowValues] = useState(false);

  const renderValue = (val: number) => (showValues ? formatCurrency(val) : 'R$ •••••');

  return (
    <Card className="border-t-4 border-primary">
      <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-primary">{title}</CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-primary flex items-center gap-1.5"
          onClick={() => setShowValues((prev) => !prev)}
          title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="text-xs font-medium">{showValues ? 'Ocultar' : 'Mostrar'}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 p-4 pt-0">
        <p className="text-sm text-muted-foreground flex justify-between">
          Faturamento: <span className="font-bold text-blue-600">{renderValue(summary.income)}</span>
        </p>
        <p className="text-sm text-muted-foreground flex justify-between">
          Custo (CMV): <span className="font-bold text-orange-600">{renderValue(summary.cost)}</span>
        </p>
        <p className="text-sm text-muted-foreground flex justify-between">
          Lucro Bruto: <span className="font-bold text-emerald-600">{renderValue(summary.grossProfit)}</span>
        </p>
        <p className="text-sm text-muted-foreground flex justify-between">
          Despesas: <span className="font-bold text-red-600">{renderValue(summary.expense)}</span>
        </p>
        <p className={`text-md font-bold pt-2 border-t mt-2 flex justify-between ${summary.balance >= 0 ? 'text-foreground' : 'text-red-700'}`}>
          Lucro Líquido: <span>{renderValue(summary.balance)}</span>
        </p>
      </CardContent>
    </Card>
  );
};
