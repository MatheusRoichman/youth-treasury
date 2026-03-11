'use client';

import { BarChart3, CreditCard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Visão Geral', icon: BarChart3 },
  { href: '/members', label: 'Membros', icon: Users },
  { href: '/contributions', label: 'Contribuições', icon: CreditCard },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3">
      {navLinks.map(({ href, label, icon: Icon }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-primary/10 hover:text-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
