'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp } from 'lucide-react';

import { WhiskIcon } from '@/components/icons/whisk-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/lib/hooks/use-auth';
import { AddTransactionSheet } from '@/components/dashboard/add-transaction-sheet';

const navLinks = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/reports', label: 'Relatórios', icon: TrendingUp },
];

export function Navbar() {
  const pathname = usePathname();
  const { isAuthReady } = useAuth();

  return (
    <header className="bg-primary shadow-lg sticky top-0 z-40">
      <nav className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <Link href="/" className="flex items-center space-x-2 text-primary-foreground">
          <WhiskIcon className="w-8 h-8 transform -rotate-12" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Doce Balanço</span>
        </Link>
        
        <div className="hidden sm:flex items-center space-x-2 bg-primary/80 p-1 rounded-full">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} passHref>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-full',
                  pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                )}
                asChild
              >
                <a>
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </a>
              </Button>
            </Link>
          ))}
        </div>

        {isAuthReady && <div className="hidden sm:block"><AddTransactionSheet /></div>}
      </nav>
      {/* Mobile Nav & Action Button */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-sm border-t border-primary-foreground/10 z-50 flex justify-around items-center p-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} passHref>
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col h-auto items-center justify-center text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground rounded-md p-2',
                  pathname === href && 'bg-primary-foreground/10 text-primary-foreground font-semibold'
                )}
                asChild
              >
                <a>
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs">{label}</span>
                </a>
              </Button>
            </Link>
          ))}
          {isAuthReady && <div className="absolute -top-16 right-4"><AddTransactionSheet /></div>}
      </div>
    </header>
  );
}
