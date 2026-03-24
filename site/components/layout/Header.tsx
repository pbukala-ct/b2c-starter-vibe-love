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
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      {/* Top bar */}
      <div className="bg-charcoal text-white text-xs py-2 px-4 text-center">
        {t('topBar')}
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-charcoal"
            aria-label={t('menu')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>

          {/* Logo */}
          <Link href={localePath('/')} className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-charcoal rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-wider">V</span>
              </div>
              <span className="font-semibold text-charcoal text-lg tracking-tight hidden sm:block">
                Vibe Home
              </span>
            </div>
          </Link>

          {/* Navigation (desktop) */}
          <MegaMenu categories={categories} />

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden md:block w-52 lg:w-64">
              <SearchBar />
            </div>

            {/* Country selector */}
            <CountrySelector />

            {/* Account */}
            <div className="relative group">
              <Link
                href={isLoggedIn ? localePath('/account') : localePath('/login')}
                className="flex items-center gap-1 text-charcoal hover:text-terra transition-colors"
                aria-label={isLoggedIn ? `Account: ${user?.firstName}` : 'Login'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {isLoggedIn && (
                  <span className="hidden sm:block text-xs font-medium">{user?.firstName}</span>
                )}
              </Link>

              {isLoggedIn && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-border shadow-lg rounded-sm w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <Link href={localePath('/account')} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-cream">{tNav('profile')}</Link>
                  <Link href={localePath('/account/orders')} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-cream">{tNav('orders')}</Link>
                  <Link href={localePath('/account/subscriptions')} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-cream">{tNav('subscriptions')}</Link>
                  <Link href={localePath('/account/addresses')} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-cream">{tNav('addresses')}</Link>
                  <Link href={localePath('/account/payments')} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-cream">{tNav('paymentMethods')}</Link>
                  <div className="border-t border-border" />
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-charcoal-light hover:bg-cream hover:text-charcoal">
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
        <div className="lg:hidden border-t border-border bg-white">
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
                    className="block py-2.5 text-sm font-medium text-charcoal border-b border-border/50"
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
                        className="block py-2 pl-4 text-sm text-charcoal-light hover:text-charcoal border-b border-border/30"
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
