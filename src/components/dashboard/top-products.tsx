'use client';
import { useProducts } from '@/app/lib/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Package } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { Button } from '../ui/button';

export function TopProducts() {
  const { products, loading } = useProducts();

  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 5);
  }, [products]);

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
            <p>Ainda não há dados de vendas para mostrar os produtos mais vendidos.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
