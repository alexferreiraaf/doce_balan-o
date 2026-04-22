'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Transaction } from '@/app/lib/types';
import { formatCurrency, parseToNumber } from '@/lib/utils';

interface DashboardChartsProps {
  transactions: Transaction[];
  startDate: Date;
  endDate: Date;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DashboardCharts({ transactions, startDate, endDate }: DashboardChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Processamento de dados para o gráfico de barras (Tendência Diária)
  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayTransactions = transactions.filter(t => {
        const tDate = new Date(t.dateMs || 0);
        return isSameDay(tDate, day);
      });

      let income = 0;
      let expense = 0;
      let cmv = 0;

      dayTransactions.forEach(t => {
        const amount = parseToNumber(t.amount);
        if (t.type === 'income') {
          const isPaid = t.status === 'paid' || (t.paymentMethod !== 'fiado' && t.paymentMethod !== null);
          if (isPaid) {
            income += amount;
          } else {
            income += parseToNumber(t.downPayment);
          }
          
          if (t.cartItems && t.cartItems.length > 0) {
            t.cartItems.forEach(item => {
              cmv += (item.cost || 0) * item.quantity;
            });
          }
        } else {
          expense += amount;
        }
      });

      return {
        name: format(day, 'dd/MM', { locale: ptBR }),
        faturamento: income,
        lucroBruto: income - cmv,
        despesa: expense,
      };
    });
  }, [transactions, startDate, endDate]);

  // Processamento de dados para o gráfico de pizza (Distribuição por Categoria)
  const categoryData = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const categories: Record<string, number> = {};

    incomeTransactions.forEach(t => {
      const category = t.category || 'Outros';
      const amount = parseToNumber(t.amount);
      categories[category] = (categories[category] || 0) + amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Processamento de dados para o gráfico de produtos (Top 10 Produtos)
  const topProductsData = useMemo(() => {
    const products: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'income' && t.cartItems) {
        t.cartItems.forEach(item => {
          products[item.name] = (products[item.name] || 0) + item.quantity;
        });
      }
    });

    return Object.entries(products)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [transactions]);

  // Processamento de dados para o gráfico de tipos de pedido
  const orderTypeData = useMemo(() => {
    let delivery = 0;
    let pickup = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        if (t.deliveryType === 'delivery') delivery++;
        else if (t.deliveryType === 'pickup') pickup++;
        // Se não tiver deliveryType, mas tiver deliveryFee > 0, assume delivery
        else if (parseToNumber(t.deliveryFee) > 0) delivery++;
        else pickup++;
      }
    });

    return [
      { name: 'Entrega', value: delivery },
      { name: 'Retirada', value: pickup }
    ].filter(item => item.value > 0);
  }, [transactions]);

  // Processamento de dados para o gráfico de formas de pagamento
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    const labels: Record<string, string> = {
      pix: 'Pix',
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      fiado: 'Fiado'
    };

    transactions.forEach(t => {
      if (t.type === 'income' && t.paymentMethod) {
        const label = labels[t.paymentMethod] || t.paymentMethod;
        methods[label] = (methods[label] || 0) + 1;
      }
    });

    return Object.entries(methods)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-bold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('R$') || typeof entry.value === 'number' && entry.dataKey === 'value' ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const SimpleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-sm text-xs">
          <p className="font-semibold">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Tendência de Fluxo de Caixa</CardTitle>
            <CardDescription>Comparativo diário entre receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7 }}
                  />
                  <YAxis 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                    tick={{ fill: 'currentColor', opacity: 0.7 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Bar dataKey="faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Faturamento" />
                  <Bar dataKey="lucroBruto" fill="#10b981" radius={[4, 4, 0, 0]} name="Lucro Bruto" />
                  <Bar dataKey="despesa" fill="#ef4444" radius={[4, 4, 0, 0]} name="Despesa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Receita por Categoria</CardTitle>
            <CardDescription>Distribuição das principais fontes de renda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', pt: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Top 10 Produtos mais vendidos</CardTitle>
          <CardDescription>Quantidade de vendas por produto no período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProductsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={10} 
                  width={150}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<SimpleTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Quantidade" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Tipos de Pedido</CardTitle>
            <CardDescription>Proporção entre Entrega e Retirada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {orderTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Formas de Pagamento</CardTitle>
            <CardDescription>Distribuição dos métodos de pagamento utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<SimpleTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
