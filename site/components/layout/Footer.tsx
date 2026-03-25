'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const { localePath } = useLocale();
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');

  return (
    <footer className="bg-charcoal mt-16 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-terra flex h-7 w-7 items-center justify-center rounded-sm">
                <span className="text-xs font-bold text-white">V</span>
              </div>
              <span className="text-lg font-semibold">Vibe Home</span>
            </div>
            <p className="text-sm leading-relaxed text-white/60">{t('tagline')}</p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider uppercase">
              {t('shopHeading')}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link
                  href={localePath('/category/furniture')}
                  className="hover:text-terra transition-colors"
                >
                  {t('furniture')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/category/home-decor')}
                  className="hover:text-terra transition-colors"
                >
                  {t('homeDecor')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/category/kitchen')}
                  className="hover:text-terra transition-colors"
                >
                  {t('kitchen')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/search?newArrival=true')}
                  className="hover:text-terra transition-colors"
                >
                  {t('newArrivals')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider uppercase">
              {t('helpHeading')}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link
                  href={localePath('/account/orders')}
                  className="hover:text-terra transition-colors"
                >
                  {t('trackOrder')}
                </Link>
              </li>
              <li>
                <Link
                  href={localePath('/account/subscriptions')}
                  className="hover:text-terra transition-colors"
                >
                  {t('manageSubscriptions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider uppercase">
              {t('accountHeading')}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href={localePath('/login')} className="hover:text-terra transition-colors">
                  {t('signIn')}
                </Link>
              </li>
              <li>
                <Link href={localePath('/register')} className="hover:text-terra transition-colors">
                  {t('createAccount')}
                </Link>
              </li>
              <li>
                <Link href={localePath('/account')} className="hover:text-terra transition-colors">
                  {t('myAccount')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row">
          <p>
            © {new Date().getFullYear()} Vibe Home. {tCommon('allRightsReserved')}
          </p>
          <div className="flex gap-4">
            <span>{tCommon('poweredBy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
