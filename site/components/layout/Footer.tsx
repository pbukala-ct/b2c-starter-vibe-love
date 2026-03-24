'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const { localePath } = useLocale();
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');

  return (
    <footer className="bg-charcoal text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-terra rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <span className="font-semibold text-lg">Vibe Home</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">{t('shopHeading')}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/category/furniture')} className="hover:text-terra transition-colors">{t('furniture')}</Link></li>
              <li><Link href={localePath('/category/home-decor')} className="hover:text-terra transition-colors">{t('homeDecor')}</Link></li>
              <li><Link href={localePath('/category/kitchen')} className="hover:text-terra transition-colors">{t('kitchen')}</Link></li>
              <li><Link href={localePath('/search?newArrival=true')} className="hover:text-terra transition-colors">{t('newArrivals')}</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">{t('helpHeading')}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/account/orders')} className="hover:text-terra transition-colors">{t('trackOrder')}</Link></li>
              <li><Link href={localePath('/account/subscriptions')} className="hover:text-terra transition-colors">{t('manageSubscriptions')}</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">{t('accountHeading')}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/login')} className="hover:text-terra transition-colors">{t('signIn')}</Link></li>
              <li><Link href={localePath('/register')} className="hover:text-terra transition-colors">{t('createAccount')}</Link></li>
              <li><Link href={localePath('/account')} className="hover:text-terra transition-colors">{t('myAccount')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-xs">
          <p>© {new Date().getFullYear()} Vibe Home. {tCommon('allRightsReserved')}</p>
          <div className="flex gap-4">
            <span>{tCommon('poweredBy')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
