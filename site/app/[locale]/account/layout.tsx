'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAccount } from '@/hooks/useAccount';
import { mutate } from 'swr';
import { KEY_ACCOUNT, KEY_CART, KEY_WISHLIST } from '@/lib/cache-keys';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useAccount();
  const { localePath } = useLocale();
  const t = useTranslations('nav');

  const navItems = [
    { path: '/account', label: t('profile'), exact: true },
    { path: '/account/orders', label: t('orders') },
    { path: '/account/subscriptions', label: t('subscriptions') },
    { path: '/account/addresses', label: t('addresses') },
    { path: '/account/payments', label: t('paymentMethods') },
    { path: '/account/wishlist', label: t('wishlist') },
    { path: '/account/security', label: t('security') },
  ];

  useEffect(() => {
    if (user === null) {
      router.replace(localePath('/login') + '?redirect=' + encodeURIComponent(pathname));
    }
  }, [user, router, pathname, localePath]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    mutate(KEY_ACCOUNT, null, { revalidate: false });
    mutate(KEY_CART, null, { revalidate: false });
    mutate(KEY_WISHLIST, null, { revalidate: false });
    router.push(localePath('/'));
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Sidebar */}
        <aside className="mb-8 lg:mb-0">
          <div className="border-border overflow-hidden rounded-sm border bg-white">
            <div className="border-border bg-cream border-b px-5 py-4">
              <p className="text-charcoal text-sm font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-charcoal-light truncate text-xs">{user.email}</p>
            </div>
            <nav className="py-2">
              {navItems.map((item) => {
                const href = localePath(item.path);
                const isActive = item.exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={item.path}
                    href={href}
                    className={`block px-5 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'text-terra bg-terra/5 font-medium'
                        : 'text-charcoal-light hover:text-charcoal hover:bg-cream'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="text-charcoal-light hover:text-charcoal hover:bg-cream border-border mt-2 w-full border-t px-5 py-2.5 text-left text-sm transition-colors"
              >
                {t('logout')}
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
