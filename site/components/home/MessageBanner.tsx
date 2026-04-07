import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import type { CTA } from './types';

interface MessageBannerProps {
  title: string;
  description: string;
  cta: CTA;
}

export default async function MessageBanner({ title, description, cta }: MessageBannerProps) {
  const t = await getTranslations();

  return (
    <section className="bg-sage/10 border-sage/20 border-y py-12">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <h2 className="text-charcoal mb-3 text-2xl font-semibold">{t(title)}</h2>
        <p className="text-charcoal-light mx-auto mb-6 max-w-md">{t(description)}</p>
        <Link
          href={cta.target}
          className="bg-sage hover:bg-sage/90 inline-block rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
        >
          {t(cta.label)}
        </Link>
      </div>
    </section>
  );
}
