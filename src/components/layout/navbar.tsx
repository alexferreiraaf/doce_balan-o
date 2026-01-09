'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, LogOut, List, User as UserIcon, LogIn, Plus, Package, Users, Archive, LayoutDashboard, ShoppingCart, Eye, FileText, Bike, PlusSquare, Settings, ChevronDown, Bell } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from './theme-toggle';
import { storefrontUserId } from '@/firebase/config';
import { Badge } from '../ui/badge';


const mainNavLinks = [
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/store-orders', label: 'Pedidos da Loja', icon: FileText, id: 'store-orders' },
  { href: '/transactions', label: 'Lançamentos', icon: List },
  { href: '/reports', label: 'Relatórios', icon: TrendingUp },
];

const registrationLinks = [
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/customers', label: 'Clientes', icon: Users },
    { href: '/optionals', label: 'Opcionais', icon: PlusSquare },
];

const mobileNavLinks = [
  { href: '/pdv', label: 'PDV', icon: ShoppingCart },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export function Navbar() {
  const pathname = usePathname();
  const { isUserLoading, user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    if (!firestore || !storefrontUserId) return;

    const q = query(
      collection(firestore, `artifacts/docuras-da-fran-default/users/${storefrontUserId}/transactions`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingOrdersCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [firestore]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Você saiu!',
        description: 'Até a próxima!',
      });
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        variant: 'destructive',
        title: 'Erro!',
        description: 'Não foi possível sair. Tente novamente.',
      });
    }
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'A';
    return email.charAt(0).toUpperCase();
  };
  
  const NavButton = ({ href, label, icon: Icon, id }: { href: string; label: string; icon: React.ElementType, id?: string }) => {
    const isStoreOrders = id === 'store-orders';
    const showBadge = isStoreOrders && pendingOrdersCount > 0;

    return (
        <Link href={href} passHref>
          <Button
            variant="ghost"
            className={cn(
              'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full relative',
              pathname === href && 'text-primary font-semibold'
            )}
            asChild
          >
            <div>
              {showBadge && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-white text-[10px]">{pendingOrdersCount}</span>
                </span>
              )}
              <Icon className="w-6 h-6 mb-0.5" />
              <span className="text-xs">{label}</span>
            </div>
          </Button>
        </Link>
    )
  };
  
  const MobileMenuButton = ({ label, icon: Icon, links }: { label: string; icon: React.ElementType; links: typeof registrationLinks }) => {
    const isAnyActive = links.some(link => pathname === link.href);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                 <Button
                    variant="ghost"
                    className={cn(
                    'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
                    isAnyActive && 'text-primary font-semibold'
                    )}
                >
                    <div>
                    <Icon className="w-6 h-6 mb-0.5" />
                    <span className="text-xs">{label}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 mb-2" align="center" side="top">
                <DropdownMenuLabel>Cadastros</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                {links.map(({ href, label, icon: Icon }) => (
                    <DropdownMenuItem key={href} onSelect={() => router.push(href)}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span>{label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  const isPOSPage = pathname === '/pdv';

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary-foreground">
          <WhiskIcon className="transform -rotate-12" width={40} height={40} fill="#FFFFFF" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Doçuras da Fran</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-1 bg-primary/80 p-1 rounded-full">
          {mainNavLinks.map(({ href, label, icon: Icon, id }) => {
            const isStoreOrders = id === 'store-orders';
            const showBadge = isStoreOrders && pendingOrdersCount > 0;
            return (
                <Link key={href} href={href} passHref>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3 relative',
                      pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                    )}
                    asChild
                  >
                    <div>
                      {showBadge && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs animate-pulse">{pendingOrdersCount}</Badge>}
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </div>
                  </Button>
                </Link>
            )
          })}
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3',
                    registrationLinks.some(l => pathname.startsWith(l.href)) && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                  )}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Cadastros
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {registrationLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} onSelect={() => router.push(href)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
            <ThemeToggle />
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary-foreground text-primary font-bold">
                                {user?.isAnonymous ? <UserIcon /> : getInitials(user?.email)}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                   {user?.isAnonymous ? (
                     <>
                        <DropdownMenuLabel>Acesso Anônimo</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => router.push('/login')}>
                            <LogIn className="mr-2 h-4 w-4" />
                            <span>Fazer Login</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push('/signup')}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Criar Conta</span>
                        </DropdownMenuItem>
                     </>
                   ) : (
                    <>
                        <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => window.open('/loja', '_blank')}>
                           <Eye className="mr-2 h-4 w-4" />
                           Ver Loja
                        </DropdownMenuItem>
                         <DropdownMenuItem onSelect={() => router.push('/settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações da Loja
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </>
                   )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

      </nav>
      
      {/* Mobile Nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 grid grid-cols-5 items-center p-1.5 gap-1">
        {mobileNavLinks.map((link) => (
            <NavButton key={link.href} {...link} />
        ))}
        
        <MobileMenuButton label="Cadastros" icon={Archive} links={registrationLinks} />
        
        <NavButton href="/store-orders" label="Pedidos" icon={FileText} id="store-orders" />
        <NavButton href="/transactions" label="Lançamentos" icon={List} />

      </div>

    </header>
  );
}
