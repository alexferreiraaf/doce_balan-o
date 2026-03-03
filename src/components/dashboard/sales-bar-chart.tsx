'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

// DADOS DE TESTE PARA DIAGNÓSTICO
const DEMO_DATA = [
  { name: 'Semana 1', Pagas: 400, Pendentes: 240 },
  { name: 'Semana 2', Pagas: 300, Pendentes: 139 },
  { name: 'Semana 3', Pagas: 200, Pendentes: 980 },
  { name: 'Semana 4', Pagas: 278, Pendentes: 390 },
];

export function SalesBarChart({ chartData }: { chartData: any[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-lg border-2 border-dashed border-primary" />;
  }

  return (
    <Card className="shadow-2xl border-4 border-primary/20 overflow-hidden my-6">
      <CardHeader className="pb-2 bg-primary/5 border-b">
        <CardTitle className="flex items-center gap-2 text-xl text-primary">
          <BarChart3 className="w-6 h-6" />
          GRÁFICO DE TESTE (DEMONSTRATIVO)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-10">
        {/* Usando uma div com altura e largura fixas para garantir que o navegador desenhe */}
        <div style={{ width: '100%', height: '400px', minHeight: '400px' }} className="border-2 border-red-500 rounded-lg p-2 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={DEMO_DATA} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#ccc" />
              <XAxis 
                dataKey="name" 
                stroke="#333"
                fontSize={12}
                tickLine={true}
              />
              <YAxis 
                stroke="#333"
                fontSize={12}
                tickLine={true}
              />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Bar 
                dataKey="Pagas" 
                name="Vendas Pagas (Demonstrativo)" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={false}
              />
              <Bar 
                dataKey="Pendentes" 
                name="A Receber (Demonstrativo)" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs text-red-500 font-bold mt-4 animate-bounce">
          AVISO: ESTE É UM GRÁFICO DE TESTE COM DADOS FIXOS.
        </p>
      </CardContent>
    </Card>
  );
}
