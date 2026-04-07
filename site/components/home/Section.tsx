import { FC, PropsWithChildren } from 'react';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import type { CTA } from './types';

export type Props = PropsWithChildren<{
  title: string;
  cta?: CTA;
}>;

const Section: FC<Props> = async ({ title, cta, children }) => {
  const t = await getTranslations();
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-charcoal text-2xl font-semibold">{t(title)}</h2>
        {cta && (
          <Link href={cta.target} className="text-terra text-sm hover:underline">
            {t(cta.label)}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{children}</div>
    </section>
  );
};

export default Section;
