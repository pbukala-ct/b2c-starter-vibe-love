'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import MegaMenu from './MegaMenu';
import MiniCart from './MiniCart';
import CountrySelector from './CountrySelector';
import SearchBar from './SearchBar';
import { Category } from '@/lib/ct/categories';
import { useLocale } from '@/context/LocaleContext';
import { getLocalizedString } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const { user, isLoggedIn } = useAuth();
  const { locale, localePath } = useLocale();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations('header');
  const tNav = useTranslations('nav');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(localePath('/'));
    router.refresh();
  };

  const topLevel = categories.filter((c) => !c.parent);

  return (
    <header className="border-border sticky top-0 z-50 border-b bg-white">
      {/* Top bar */}
      <div className="bg-charcoal px-4 py-2 text-center text-xs text-white">{t('topBar')}</div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-charcoal lg:hidden"
            aria-label={t('menu')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>

          {/* Logo */}
          <Link href={localePath('/')} className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-charcoal flex h-7 w-7 items-center justify-center rounded-sm">
                <span className="text-xs font-bold tracking-wider text-white">V</span>
              </div>
              <span className="text-charcoal hidden text-lg font-semibold tracking-tight sm:block">
                Vibe Home
              </span>
            </div>
          </Link>

          {/* Navigation (desktop) */}
          <MegaMenu categories={categories} />

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden w-52 md:block lg:w-64">
              <SearchBar />
            </div>

            {/* Country selector */}
            <CountrySelector />

            {/* Account */}
            <div className="group relative">
              <Link
                href={isLoggedIn ? localePath('/account') : localePath('/login')}
                className="text-charcoal hover:text-terra flex items-center gap-1 transition-colors"
                aria-label={isLoggedIn ? `Account: ${user?.firstName}` : 'Login'}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {isLoggedIn && (
                  <span className="hidden text-xs font-medium sm:block">{user?.firstName}</span>
                )}
              </Link>

              {isLoggedIn && (
                <div className="border-border invisible absolute top-full right-0 z-50 mt-1 w-48 rounded-sm border bg-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <Link
                    href={localePath('/account')}
                    className="text-charcoal hover:bg-cream block px-4 py-2.5 text-sm"
                  >
                    {tNav('profile')}
                  </Link>
                  <Link
                    href={localePath('/account/orders')}
                    className="text-charcoal hover:bg-cream block px-4 py-2.5 text-sm"
                  >
                    {tNav('orders')}
                  </Link>
                  <Link
                    href={localePath('/account/subscriptions')}
                    className="text-charcoal hover:bg-cream block px-4 py-2.5 text-sm"
                  >
                    {tNav('subscriptions')}
                  </Link>
                  <Link
                    href={localePath('/account/addresses')}
                    className="text-charcoal hover:bg-cream block px-4 py-2.5 text-sm"
                  >
                    {tNav('addresses')}
                  </Link>
                  <Link
                    href={localePath('/account/payments')}
                    className="text-charcoal hover:bg-cream block px-4 py-2.5 text-sm"
                  >
                    {tNav('paymentMethods')}
                  </Link>
                  <div className="border-border border-t" />
                  <button
                    onClick={handleLogout}
                    className="text-charcoal-light hover:bg-cream hover:text-charcoal w-full px-4 py-2.5 text-left text-sm"
                  >
                    {tNav('logout')}
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            <MiniCart />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-border border-t bg-white lg:hidden">
          {/* Mobile search */}
          <div className="px-4 py-3">
            <SearchBar />
          </div>
          {/* Mobile nav */}
          <nav className="px-4 pb-4">
            {topLevel.map((cat) => {
              const name = getLocalizedString(cat.name, locale);
              const slug = cat.slug['en-US'] || Object.values(cat.slug)[0];
              return (
                <div key={cat.id}>
                  <Link
                    href={localePath(`/category/${slug}`)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-charcoal border-border/50 block border-b py-2.5 text-sm font-medium"
                  >
                    {name}
                  </Link>
                  {cat.children?.map((child) => {
                    const childName = getLocalizedString(child.name, locale);
                    const childSlug = child.slug['en-US'] || Object.values(child.slug)[0];
                    return (
                      <Link
                        key={child.id}
                        href={localePath(`/category/${childSlug}`)}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-charcoal-light hover:text-charcoal border-border/30 block border-b py-2 pl-4 text-sm"
                      >
                        {childName}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
