'use client';

import { useProducts } from '@/app/lib/hooks/use-products';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import type { Product, ProductCategory, Transaction, Customer } from '@/app/lib/types';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Package, ShoppingCart, Tag, Trash2, X, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { WhiskIcon } from '../icons/whisk-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { AddTransactionSheet } from '../dashboard/add-transaction-sheet';
import { useToast } from '@/hooks/use-toast';

interface GroupedProducts {
  [categoryName: string]: Product[];
}

interface CartItem extends Product {
  quantity: number;
}

export function StorefrontClient() {
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useProductCategories();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();

  const loading = productsLoading || categoriesLoading;

  const groupedProducts = useMemo(() => {
    const group: GroupedProducts = {};

    categories.forEach(cat => {
      group[cat.name] = [];
    });
    group['Outros'] = [];

    products.forEach(product => {
      const category = categories.find(c => c.id === product.categoryId);
      const categoryName = category ? category.name : 'Outros';
      if (!group[categoryName]) {
        group[categoryName] = [];
      }
      group[categoryName].push(product);
    });

    // Clean up empty categories
    Object.keys(group).forEach(key => {
      if (group[key].length === 0) {
        delete group[key];
      }
    });

    return group;
  }, [products, categories]);
  
  const categoryOrder = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'Outros') return 1;
    if (b === 'Outros') return -1;
    return a.localeCompare(b);
  });

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart(currentCart => {
      if (quantity <= 0) {
        return currentCart.filter(item => item.id !== productId);
      }
      return currentCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleFinalizeClick = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  const handleSaleFinalized = (transaction: Transaction, customer?: Customer) => {
    setIsCheckoutOpen(false);
    setCart([]);
    toast({
      title: "Pedido Recebido!",
      description: "Seu pedido foi enviado. Entraremos em contato em breve para confirmar.",
    });
  };


  if (loading) {
    return null; // The loading skeleton is handled by Suspense
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
            <WhiskIcon className="w-16 h-16 text-primary" />
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">Cardápio Doçuras da Fran</h1>
                <p className="text-muted-foreground mt-1">Escolha seus doces favoritos e faça seu pedido!</p>
            </div>
        </div>
      </header>

      {categoryOrder.length === 0 ? (
        <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Nenhum produto no cardápio</h2>
            <p className="mt-2 text-muted-foreground">Volte em breve para ver nossas delícias!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {categoryOrder.map(categoryName => (
            <section key={categoryName}>
              <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
                <Tag className="w-6 h-6 text-primary/80" />
                {categoryName}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedProducts[categoryName].map(product => (
                  <Card key={product.id} className="overflow-hidden flex flex-col group">
                    <CardHeader className="p-0">
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <Package className="w-16 h-16 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                      <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                      <div className="flex justify-between items-end mt-4">
                        <p className="text-xl font-bold text-primary">{formatCurrency(product.price)}</p>
                        <Button variant="outline" size="sm" onClick={() => handleAddToCart(product)}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Pedir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Floating Cart Button */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button size="lg" className="rounded-full shadow-lg h-16" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart className="w-6 h-6 mr-3" />
            <div className="text-left">
              <span className="font-bold">{totalItems} {totalItems > 1 ? 'itens' : 'item'}</span>
              <div className="text-sm">{formatCurrency(cartTotal)}</div>
            </div>
          </Button>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-2xl">Seu Pedido</SheetTitle>
          </SheetHeader>
          {cart.length > 0 ? (
            <>
              <ScrollArea className="flex-grow my-4">
                <div className="space-y-4 pr-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-start gap-4">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md object-cover aspect-square" />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground"/>
                        </div>
                      )}
                      <div className="flex-grow">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-lg w-5 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 mt-2 text-muted-foreground hover:text-destructive" onClick={() => handleUpdateQuantity(item.id, 0)}>
                           <Trash2 className="h-4 w-4"/>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <SheetFooter className="mt-auto pt-4 border-t">
                <div className="w-full space-y-4">
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button size="lg" className="w-full h-12 text-lg" onClick={handleFinalizeClick}>
                    Finalizar Pedido
                  </Button>
                </div>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Seu carrinho está vazio</p>
              <p>Adicione produtos para começar um pedido.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AddTransactionSheet 
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart}
        cartTotal={cartTotal}
        onSaleFinalized={handleSaleFinalized}
        fromStorefront
      />

    </div>
  );
}
