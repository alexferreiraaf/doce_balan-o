'use client';

import * as React from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer } from '@/app/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CustomerSelectProps {
  customers: Customer[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export function CustomerSelect({
  customers,
  value,
  onValueChange,
  disabled,
  placeholder = 'Selecione um cliente',
}: CustomerSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const selectedCustomer = React.useMemo(
    () => customers.find((c) => c.id === value),
    [customers, value]
  );

  const filteredCustomers = React.useMemo(() => {
    const query = normalizeText(search.trim());
    if (!query) return customers;
    return customers.filter((c) => {
      const nameMatch = normalizeText(c.name || '').includes(query);
      const phoneMatch = (c.whatsapp || '').toLowerCase().includes(query);
      return nameMatch || phoneMatch;
    });
  }, [customers, search]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !selectedCustomer && 'text-muted-foreground'
          )}
        >
          <span className="line-clamp-1 text-left">
            {selectedCustomer ? selectedCustomer.name : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          // Let the search input autoFocus naturally
        }}
      >
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="ml-1 text-muted-foreground hover:text-foreground"
              title="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div
          className="max-h-60 overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {filteredCustomers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = c.id === value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onValueChange(c.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-left outline-none hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/60 font-medium'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
