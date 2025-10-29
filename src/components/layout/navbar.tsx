'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrendingUp, LogOut, List, User as UserIcon, LogIn, Plus, Package, Users, Archive } from 'lucide-react';
import { signOut } from 'firebase/auth';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';
import { useAuth, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const navLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/transactions', label: 'Lançamentos', icon: List },
  { href: '/reports', label: 'Relatórios', icon: TrendingUp },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/customers', label: 'Clientes', icon: Users },
];

const mobileNavLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/transactions', label: 'Lançamentos', icon: List },
];

const registrationLinks = [
    { href: '/products', label: 'Produtos', icon: Package },
    { href: '/customers', label: 'Clientes', icon: Users },
];

export function Navbar() {
  const pathname = usePathname();
  const { isUserLoading, user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

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
  
  const NavButton = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => (
    <Link href={href} passHref>
      <Button
        variant="ghost"
        className={cn(
          'flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full',
          pathname === href && 'text-primary font-semibold'
        )}
        asChild
      >
        <div>
          <Icon className="w-6 h-6 mb-0.5" />
          <span className="text-xs">{label}</span>
        </div>
      </Button>
    </Link>
  );

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary-foreground">
          <WhiskIcon className="transform -rotate-12" width={40} height={40} />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Doçuras da Fran</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-1 bg-primary/80 p-1 rounded-full">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} passHref>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full px-3',
                  pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                )}
                asChild
              >
                <div>
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </div>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
            {!isUserLoading && (
                <div className="hidden sm:block">
                    <AddTransactionSheet />
                </div>
            )}
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
        
        <div className="flex justify-center items-center">
            <AddTransactionSheet isMobile />
        </div>

        <NavButton href="/reports" label="Relatórios" icon={TrendingUp} />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex flex-col h-auto items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-2 w-full"
                >
                    <Archive className="w-6 h-6 mb-0.5" />
                    <span className="text-xs">Cadastros</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2 w-40">
                 {registrationLinks.map(link => (
                     <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href} className="flex items-center gap-2">
                           <link.icon className="w-4 h-4" />
                           <span>{link.label}</span>
                        </Link>
                    </DropdownMenuItem>
                 ))}
            </DropdownMenuContent>
        </DropdownMenu>

      </div>

    </header>
  );
}
