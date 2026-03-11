'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/account', label: 'Profile', exact: true },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/subscriptions', label: 'Subscriptions' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/payments', label: 'Payment Methods' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (user === null) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Sidebar */}
        <aside className="mb-8 lg:mb-0">
          <div className="bg-white border border-border rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-cream">
              <p className="font-semibold text-charcoal text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-charcoal-light truncate">{user.email}</p>
            </div>
            <nav className="py-2">
              {navItems.map(item => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'text-terra font-medium bg-terra/5'
                        : 'text-charcoal-light hover:text-charcoal hover:bg-cream'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full text-left px-5 py-2.5 text-sm text-charcoal-light hover:text-charcoal hover:bg-cream transition-colors border-t border-border mt-2"
              >
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
