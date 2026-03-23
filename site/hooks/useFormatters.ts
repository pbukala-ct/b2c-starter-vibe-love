'use client';

import { useLocale } from '@/context/LocaleContext';
import { formatMoney as _formatMoney, getLocalizedString as _getString } from '@/lib/utils';

export function useFormatters() {
  const { locale, currency } = useLocale();

  function formatMoney(centAmount: number, currencyCode?: string) {
    return _formatMoney(centAmount, currencyCode ?? currency);
  }

  function getLocalizedString(obj: Record<string, string> | undefined) {
    return _getString(obj, locale);
  }

  function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
    const opts = options ?? { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(locale, opts);
  }

  return { formatMoney, getLocalizedString, formatDate };
}
