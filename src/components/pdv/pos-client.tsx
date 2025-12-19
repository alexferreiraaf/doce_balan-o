'use client';
import { useState } from 'react';
import { useProducts } from '@/app/lib/hooks/use-products';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/app/lib/types';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface CartItem extends Product {
  quantity: number;
}

function POSLoading() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
            <div className="lg:col-span-2">
                 <ScrollArea className="h-full pr-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(12)].map((_, i) => (
                             <Card key={i} className="animate-pulse">
                                <div className="p-4 space-y-2">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                             </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <div className="lg:col-span-1">
                 <Card className="h-full flex flex-col p-4 animate-pulse">
                    <Skeleton className="h-8 w-1/2 mb-4" />
                    <div className="flex-grow space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="mt-auto pt-4 border-t">
                        <Skeleton className="h-8 w-3/4 mb-2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </Card>
            </div>
        </div>
    )
}

export function POSClient() {
  const { products, loading: productsLoading } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (productsLoading) {
    return <POSLoading />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
      {/* Product Selection */}
      <div className="lg:col-span-2 bg-card border rounded-lg">
        <ScrollArea className="h-full p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                onClick={() => addToCart(product)}
              >
                <div className="p-4 flex flex-col justify-between h-full">
                  <h3 className="font-semibold text-card-foreground">{product.name}</h3>
                  <p className="text-primary font-bold mt-2">{formatCurrency(product.price)}</p>
                </div>
              </Card>
            ))}
             {products.length === 0 && (
                <div className="col-span-full text-center py-10">
                    <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sale Summary */}
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6"/> Venda Atual</h2>
          </div>
          <ScrollArea className="flex-grow p-4">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                <p>Selecione produtos para iniciar uma venda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <div className="flex-grow">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                         <MinusCircle className="w-4 h-4 text-destructive" />
                       </Button>
                       <span className="font-bold w-4 text-center">{item.quantity}</span>
                       <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                         <PlusCircle className="w-4 h-4 text-green-600" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="p-4 mt-auto border-t space-y-3">
             <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
             </div>
            <Button className="w-full h-12 text-lg" disabled={cart.length === 0}>
              Finalizar Venda
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
