'use client';

import { useProducts } from '@/app/lib/hooks/use-products';
import { useProductCategories } from '@/app/lib/hooks/use-product-categories';
import type { AppSettings, DayOfWeek, Product, ProductSize, ProductCategory } from '@/app/lib/types';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Package, ShoppingCart, Tag, Trash2, X, Plus, Minus, Flame, Clock, Percent, ChevronDown, ChevronRight, MapPin, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { WhiskIcon } from '../icons/whisk-icon';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '../ui/sheet';
import { ScrollArea } from '../ui/scroll-area';
import { AddTransactionSheet } from '../dashboard/add-transaction-sheet';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useSettings } from '@/app/lib/hooks/use-settings';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ThemeToggle } from '../layout/theme-toggle';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { OrderProgressBar } from './order-progress-bar';
import { useOrderTracking } from '@/app/lib/hooks/use-order-tracking';
import type { Transaction } from '@/app/lib/types';
import Loading from '@/app/loja/loading';


interface CartItem extends Product {
  quantity: number;
}

const weekDayMap: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};


interface StorefrontClientProps {
  initialProducts?: Product[];
  initialCategories?: ProductCategory[];
  initialSettings?: AppSettings;
}

export function StorefrontClient({
  initialProducts,
  initialCategories,
  initialSettings,
}: StorefrontClientProps = {}) {
  const { products: fetchedProducts, loading: productsLoading } = useProducts();
  const { categories: fetchedCategories, loading: categoriesLoading } = useProductCategories();
  const { settings: fetchedSettings, loading: settingsLoading } = useSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { toast } = useToast();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [showPromotions, setShowPromotions] = useState(false);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  // State for size selection
  const [selectedProductForSizes, setSelectedProductForSizes] = useState<Product | null>(null);

  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [isClient, setIsClient] = useState(false);
  
  // Tracking state
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderUserId, setActiveOrderUserId] = useState<string | null>(null);
  const { transaction: activeOrder } = useOrderTracking(activeOrderId, activeOrderUserId);
  const searchParams = useSearchParams();
  const hasHandledDeepLink = useRef(false);

  const hasInitialProducts = initialProducts && initialProducts.length > 0;
  const hasInitialCategories = initialCategories && initialCategories.length > 0;
  const hasInitialSettings = initialSettings && Object.keys(initialSettings).length > 0;

  const products = (productsLoading && hasInitialProducts) ? initialProducts : fetchedProducts;
  const categories = (categoriesLoading && hasInitialCategories) ? initialCategories : fetchedCategories;
  const settings = (settingsLoading && hasInitialSettings) ? initialSettings : fetchedSettings;

  const isProductsLoading = productsLoading && !hasInitialProducts;
  const isCategoriesLoading = categoriesLoading && !hasInitialCategories;
  const isSettingsLoading = settingsLoading && !hasInitialSettings;
  const loading = isProductsLoading || isCategoriesLoading || isSettingsLoading;

  const [storeStatus, setStoreStatus] = useState<{ isOpen: boolean; message: string; isStatusLoading: boolean }>({
    isOpen: false,
    message: 'Verificando horário...',
    isStatusLoading: true,
  });

  useEffect(() => {
    if (!isClient || isSettingsLoading) {
      setStoreStatus(prev => ({...prev, isStatusLoading: true}));
      return;
    }

    const getStatus = (): { isOpen: boolean; message: string } => {
      if (!settings?.openingHours) {
        return { isOpen: true, message: '' };
      }
    
      const now = new Date();
      const currentDay = weekDayMap[now.getDay()];
      const todaySettings = settings.openingHours[currentDay];
    
      if (!todaySettings || !todaySettings.enabled) {
        return { isOpen: false, message: 'Hoje estamos fechados.' };
      }
    
      const [openHour, openMinute] = todaySettings.open.split(':').map(Number);
      const [closeHour, closeMinute] = todaySettings.close.split(':').map(Number);
      
      const openTime = new Date();
      openTime.setHours(openHour, openMinute, 0, 0);
    
      const closeTime = new Date();
      closeTime.setHours(closeHour, closeMinute, 0, 0);
    
      if (now >= openTime && now < closeTime) {
        return { isOpen: true, message: '' };
      } else if (now < openTime) {
        return { isOpen: false, message: `Abrimos hoje às ${todaySettings.open}.` };
      } else {
         return { isOpen: false, message: `Fechamos hoje às ${todaySettings.close}.` };
      }
    };

    setStoreStatus({ ...getStatus(), isStatusLoading: false });
  }, [settings, isSettingsLoading, isClient]);

  useEffect(() => {
    const productIdFromQuery = searchParams.get('p');
    if (!isProductsLoading && !storeStatus.isStatusLoading && productIdFromQuery && !hasHandledDeepLink.current && products.length > 0) {
      const product = products.find(p => p.id === productIdFromQuery);
      if (product) {
        handleAddToCart(product);
      }
      // Always mark as handled if it's no longer loading, even if not found, to avoid infinite loops
      hasHandledDeepLink.current = true;
    }
  }, [isProductsLoading, storeStatus.isStatusLoading, products, searchParams]);

  useEffect(() => {
    setIsClient(true);
    // Load tracking from localStorage
    if (typeof window !== 'undefined') {
      const savedOrderId = localStorage.getItem('lastOrderId');
      const savedUserId = localStorage.getItem('lastOrderUserId');
      if (savedOrderId && savedUserId) {
        setActiveOrderId(savedOrderId);
        setActiveOrderUserId(savedUserId);
      }

      // Load cart from localStorage
      const savedCart = localStorage.getItem('storeCart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse saved cart', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && cart.length > 0) {
      localStorage.setItem('storeCart', JSON.stringify(cart));
    } else if (isClient && cart.length === 0) {
      localStorage.removeItem('storeCart');
    }
  }, [cart, isClient]);

  useEffect(() => {
    if (auth && !isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error('Failed to sign in anonymously', error);
      });
    }
  }, [auth, user, isUserLoading]);

  const { promotionalProducts, featuredProducts, bestSellerThreshold, regularProducts } = useMemo(() => {
    if (products.length === 0) {
      return { promotionalProducts: [], featuredProducts: [], bestSellerThreshold: 0, regularProducts: [] };
    }

    const availableProducts = products.filter(p => p.isAvailable ?? true);

    const promotions = availableProducts.filter(p => p.isPromotion);
    const featured = availableProducts.filter(p => p.isFeatured).slice(0, 12);

    const salesCounts = availableProducts.map(p => p.salesCount || 0).sort((a, b) => b - a);
    const threshold = salesCounts.length > 3 ? salesCounts[2] : 0;
    
    return { 
      promotionalProducts: promotions,
      featuredProducts: featured,
      bestSellerThreshold: threshold,
      regularProducts: availableProducts,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === 'all') {
      return regularProducts;
    }
    return regularProducts.filter(p => p.categoryId === selectedCategoryId);
  }, [regularProducts, selectedCategoryId]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.promotionalPrice ?? item.price) * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product, size?: ProductSize) => {
    if (product.isAvailable === false) {
      toast({
       variant: 'destructive',
       title: 'Produto em Falta!',
       description: 'Este item não está disponível no momento.',
     });
     return;
   }
    if (storeStatus.isStatusLoading || !storeStatus.isOpen) {
       toast({
        variant: 'destructive',
        title: 'Loja Fechada!',
        description: storeStatus.message,
      });
      return;
    }

    // Se o produto tem tamanhos e nenhum foi escolhido ainda
    if (product.sizes && product.sizes.length > 0 && !size) {
      setSelectedProductForSizes(product);
      return;
    }

    const hasPromo = !size && product.isPromotion && product.promotionalPrice != null && product.promotionalPrice >= 0;
    const isPromoSize = size?.name === "Promoção";
    const effectivePrice = size ? size.price : (hasPromo ? product.promotionalPrice! : product.price);

    const finalProduct = {
      ...product,
      name: size ? `${product.name} (${size.name})` : (hasPromo ? `${product.name} (Promoção)` : product.name),
      price: effectivePrice,
      id: size ? `${product.id}-${size.name}` : (hasPromo ? `${product.id}-promo` : product.id),
      promotionalPrice: (hasPromo || isPromoSize) ? effectivePrice : undefined,
    };

    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === finalProduct.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === finalProduct.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...finalProduct, quantity: 1 }];
    });

    setSelectedProductForSizes(null);
    setIsCartOpen(true);
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
    if (storeStatus.isStatusLoading || !storeStatus.isOpen) {
      toast({
        variant: 'destructive',
        title: 'Loja Fechada!',
        description: storeStatus.message,
      });
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }

  const handleSaleFinalized = (transaction: Transaction) => {
    setIsCheckoutOpen(false);
    setCart([]);
    
    // Save for tracking
    setActiveOrderId(transaction.id);
    setActiveOrderUserId(transaction.userId);
    localStorage.setItem('lastOrderId', transaction.id);
    localStorage.setItem('lastOrderUserId', transaction.userId);
    localStorage.removeItem('storeCart');

    toast({
      title: "Pedido Recebido!",
      description: "Seu pedido foi enviado. Acompanhe o progresso no topo da página.",
    });
  };

  const handleClearTracking = () => {
    setActiveOrderId(null);
    setActiveOrderUserId(null);
    localStorage.removeItem('lastOrderId');
    localStorage.removeItem('lastOrderUserId');
  }

  const handleWhatsappClick = () => {
    if (!storeStatus.isOpen) {
        toast({
            variant: "destructive",
            title: "Loja Fechada",
            description: "No momento não estamos disponíveis no WhatsApp."
        });
        return;
    }
    const cleanPhone = settings?.phone?.replace(/\D/g, '') || '';
    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    } else {
      toast({
          variant: "destructive",
          title: "Número indisponível",
          description: "O WhatsApp da loja não foi configurado."
      });
    }
  }

  if (loading) {
    return <Loading />;
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const isBestSeller = (product.salesCount || 0) > 0 && (product.salesCount || 0) >= bestSellerThreshold;
    const hasPromo = product.isPromotion && product.promotionalPrice != null && product.promotionalPrice >= 0;
    const hasSizes = product.sizes && product.sizes.length > 0;
    const lowestPrice = hasSizes ? Math.min(...product.sizes!.map(s => s.price)) : product.price;
    const displayPrice = hasPromo ? product.promotionalPrice! : lowestPrice;
    const isAvailable = product.isAvailable ?? true;
    
    return (
       <Card className={cn("overflow-hidden flex flex-col group h-full", !isAvailable && "opacity-60")}>
            <CardHeader className="p-0">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                            <p className="text-white font-bold text-lg">Em Falta</p>
                        </div>
                    )}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        {isBestSeller && (
                            <div className="bg-black/70 text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-400"/>
                                Mais Pedido
                            </div>
                        )}
                        {hasPromo && (
                           <div className="bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-full flex items-center gap-1">
                                <Percent className="w-3 h-3"/>
                                Promoção
                            </div>
                        )}
                    </div>
                {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <Package className="w-16 h-16 text-muted-foreground" />
                )}
                </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-lg flex-grow leading-tight">{product.name}</h3>
                <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col items-start">
                        {hasPromo && (
                            <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</p>
                        )}
                        <p className="text-xl font-bold text-primary">
                          {hasSizes && !hasPromo ? `A partir de ` : ''}
                          {formatCurrency(displayPrice)}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddToCart(product)} disabled={!isAvailable}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Pedir
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-12 pb-24">
      {isClient && activeOrder && (
        <OrderProgressBar 
            transaction={activeOrder} 
            onClose={handleClearTracking} 
        />
      )}

      <div className="w-full bg-[#111] dark:bg-black rounded-xl sm:rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-white/5">
        {settings?.coverImageUrl && (
          <>
            <Image src={settings.coverImageUrl} alt="Capa" fill style={{ objectFit: 'cover' }} className="opacity-40 object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent pointer-events-none z-0" />
          </>
        )}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="flex flex-col-reverse sm:flex-row gap-6 sm:gap-8 justify-between w-full relative z-10">
          <div className="flex flex-col justify-center gap-4">
            <div>
               <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">{settings?.storeName || 'Doçuras da Fran'}</h1>
               <p className="text-sm text-zinc-400 flex items-center gap-1.5 mb-1"><MapPin className="w-4 h-4 text-primary shrink-0"/> {settings?.address || 'Andradas, MG'}</p>
               <p className="text-sm text-zinc-400 flex items-center gap-1.5 mb-3"><Package className="w-4 h-4 text-primary shrink-0"/> Retirada ou Entrega</p>
               {settings?.phone && (
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="bg-emerald-600 hover:bg-emerald-700 text-white border-none w-fit font-bold shadow-md opacity-90 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed h-8"
                   onClick={handleWhatsappClick}
                   disabled={!storeStatus.isOpen && !storeStatus.isStatusLoading}
                 >
                   <MessageCircle className="w-4 h-4 mr-2" />
                   Falar no WhatsApp
                 </Button>
               )}
            </div>
            
            <div className="flex items-center gap-4 text-sm font-medium">
               {!storeStatus.isStatusLoading && (
                 storeStatus.isOpen ? (
                   <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-none px-3 py-1 shadow-md shadow-emerald-900/20">
                     Aberto
                   </Badge>
                 ) : (
                   <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold border-none px-3 py-1 shadow-md shadow-red-900/20 flex items-center gap-1">
                     <X className="w-3 h-3"/> Fechado
                   </Badge>
                 )
               )}
               
               <div className="flex flex-col text-zinc-400 text-xs gap-0.5 font-semibold">
                  {!storeStatus.isOpen && !storeStatus.isStatusLoading && (
                    <span className="text-red-300">{storeStatus.message}</span>
                  )}
               </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-white">
               <Image src={settings?.logoUrl || "/logo.png"} alt="Doçuras da Fran" layout="fill" objectFit="contain" className="p-1" />
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className={`relative bg-primary/20 text-primary-foreground hover:bg-primary/30 border border-primary/30 transition-all duration-300 ${
                  promotionalProducts.length > 0 
                    ? (showPromotions 
                        ? 'font-bold shadow-md' 
                        : 'animate-pulse font-bold scale-105') 
                    : ''
                }`} 
                onClick={() => setShowPromotions(!showPromotions)} 
                aria-expanded={showPromotions}
              >
                {promotionalProducts.length > 0 && !showPromotions && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
                <Percent className="w-4 h-4 mr-2" />
                Promoções
              </Button>
              <div className="bg-white/10 backdrop-blur-sm rounded-md overflow-hidden border border-white/5">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Collapsible open={showPromotions} className="w-full">
        <CollapsibleContent className="animate-in fade-in-0 zoom-in-95">
            {promotionalProducts.length > 0 ? (
                <div className='space-y-4'>
                    <h2 className="text-2xl font-bold tracking-tight">✨ Promoções</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {promotionalProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-muted-foreground bg-muted/50 rounded-lg">
                <p className="font-semibold">Nenhuma promoção ativa no momento.</p>
                <p className="text-sm">Volte em breve para conferir as novidades!</p>
                </div>
            )}
        </CollapsibleContent>
      </Collapsible>

      {products.length === 0 ? (
        <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Nenhum produto no cardápio</h2>
            <p className="mt-2 text-muted-foreground">Volte em breve para ver nossas delícias!</p>
        </div>
      ) : (
        <div className="space-y-12">
            {featuredProducts.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">✨ Destaques da Casa</h2>
                    <Carousel
                      plugins={[autoplayPlugin.current]}
                      opts={{
                        align: "start",
                        loop: true,
                      }}
                      className="w-full relative"
                      onMouseEnter={autoplayPlugin.current.stop}
                      onMouseLeave={autoplayPlugin.current.reset}
                    >
                      <CarouselContent className="-ml-4 sm:-ml-6 py-2">
                        {featuredProducts.map((product) => (
                          <CarouselItem key={product.id} className="pl-4 sm:pl-6 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                             <ProductCard product={product} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="hidden sm:block">
                        <CarouselPrevious className="-left-4 sm:-left-12" />
                        <CarouselNext className="-right-4 sm:-right-12" />
                      </div>
                    </Carousel>
                </div>
            )}
          
            <div className='space-y-6'>
                <h2 className="text-2xl font-bold tracking-tight">Todos os Produtos</h2>
                <div className="max-w-xs">
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filtrar por categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as categorias</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
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

      {/* Modal para Seleção de Tamanho */}
      <Dialog open={!!selectedProductForSizes} onOpenChange={(open) => !open && setSelectedProductForSizes(null)}>
        <DialogContent className="max-w-[92vw] sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle>Escolha o Tamanho</DialogTitle>
            <DialogDescription className="break-words">
              Selecione a opção desejada para <strong>{selectedProductForSizes?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 w-full">
            {selectedProductForSizes?.isPromotion && selectedProductForSizes.promotionalPrice != null && selectedProductForSizes.promotionalPrice >= 0 ? (
              <Button
                variant="outline"
                className="w-full max-w-full justify-between h-auto py-3 px-3.5 text-base font-semibold group border-red-500 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 gap-2"
                onClick={() => handleAddToCart(selectedProductForSizes!, { name: "Promoção", price: selectedProductForSizes.promotionalPrice! })}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Badge className="bg-red-600 hover:bg-red-600 text-white text-xs sm:text-sm px-2.5 py-1 shadow-sm flex items-center gap-1.5 font-bold shrink-0">
                    <Percent className="w-3.5 h-3.5 fill-current shrink-0" />
                    Preço Promocional
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-extrabold text-lg text-red-600 dark:text-red-400">{formatCurrency(selectedProductForSizes.promotionalPrice)}</span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </Button>
            ) : (
              selectedProductForSizes?.sizes?.map((size) => (
                <Button
                  key={size.name}
                  variant="outline"
                  className="w-full max-w-full justify-between h-auto py-3.5 px-4 text-base font-semibold group gap-2"
                  onClick={() => handleAddToCart(selectedProductForSizes!, size)}
                >
                  <span className="truncate text-left min-w-0">{size.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-primary font-bold">{formatCurrency(size.price)}</span>
                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                        <p className="font-semibold text-sm leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(item.promotionalPrice ?? item.price)}</p>
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
                        <p className="font-bold text-sm">{formatCurrency((item.promotionalPrice ?? item.price) * item.quantity)}</p>
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
                  <Button variant="outline" size="lg" className="w-full h-12 text-lg" onClick={() => setIsCartOpen(false)}>
                    Continuar Comprando
                  </Button>
                  <Button size="lg" className="w-full h-12 text-lg" onClick={handleFinalizeClick} disabled={storeStatus.isStatusLoading || !storeStatus.isOpen}>
                     {storeStatus.isStatusLoading ? 'Verificando...' : (storeStatus.isOpen ? 'Finalizar Pedido' : 'Loja Fechada')}
                  </Button>
                   {!storeStatus.isStatusLoading && !storeStatus.isOpen && <p className="text-center text-sm text-destructive">{storeStatus.message}</p>}
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
        fromStorefront={true}
      />

    </div>
  );
}
