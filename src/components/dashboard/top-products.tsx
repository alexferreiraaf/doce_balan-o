'use client';
import { useProducts } from '@/app/lib/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Package } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { Button } from '../ui/button';
import type { Transaction } from '@/app/lib/types';

interface TopProductsProps {
  transactions: Transaction[];
}

export function TopProducts({ transactions }: TopProductsProps) {
  const { products, loading } = useProducts();

  const topProducts = useMemo(() => {
    if (!products || !transactions) return [];

    const salesCountInPeriod: { [productId: string]: number } = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'income' && transaction.cartItems) {
        transaction.cartItems.forEach(item => {
          salesCountInPeriod[item.id] = (salesCountInPeriod[item.id] || 0) + item.quantity;
        });
      }
    });

    return products
      .map(product => ({
        ...product,
        salesCount: salesCountInPeriod[product.id] || 0
      }))
      .filter(product => product.salesCount > 0)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);
  }, [products, transactions]);


  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Produtos Mais Vendidos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-center'>
            <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Produtos Mais Vendidos
            </CardTitle>
            <Button asChild variant="link">
                <Link href="/products">Ver todos</Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {topProducts.length > 0 ? (
          <ul className="space-y-3">
            {topProducts.map((product) => (
              <li key={product.id} className="flex justify-between items-center text-sm">
                <span className="font-medium text-card-foreground">{product.name}</span>
                <span className="font-bold text-primary">{product.salesCount || 0} vendas</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p>Nenhuma venda registrada neste período para mostrar os produtos mais vendidos.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
