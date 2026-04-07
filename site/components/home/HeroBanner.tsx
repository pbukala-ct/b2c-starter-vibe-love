import Link from 'next/link';
import heroConfig from '@/config/hero.json';
import { DEFAULT_LOCALE } from '@/lib/utils';
import { getLocale } from '@/lib/session';

export default async function HeroBanner() {
  const { locale } = await getLocale();
  const { backgroundImage, subTitle, title, text, buttons } = heroConfig;
  const l = (field: Record<string, string>) => field[locale] ?? field[DEFAULT_LOCALE.locale];

  return (
    <section className="bg-charcoal relative flex min-h-[60vh] items-center overflow-hidden text-white">
      <div className="from-charcoal via-charcoal/90 to-charcoal/60 absolute inset-0 z-10 bg-linear-to-r" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${backgroundImage}')`,
          opacity: 0.3,
        }}
      />
      <div className="relative z-20 mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="max-w-xl">
          <p className="text-terra mb-4 text-sm font-medium tracking-widest uppercase">
            {l(subTitle)}
          </p>
          <h1
            className="mb-6 text-4xl leading-tight font-light md:text-6xl"
            dangerouslySetInnerHTML={{ __html: l(title) }}
          ></h1>
          <p className="mb-8 text-lg leading-relaxed text-white/70">{l(text)}</p>
          <div className="flex gap-4">
            {buttons.map((btn) => (
              <Link
                key={btn.href}
                href={`/${locale.toLowerCase()}${btn.href}`}
                className={
                  btn.variant === 'primary'
                    ? 'text-charcoal hover:bg-cream rounded-sm bg-white px-6 py-3 text-sm font-medium transition-colors'
                    : 'rounded-sm border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10'
                }
              >
                {l(btn.label)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
