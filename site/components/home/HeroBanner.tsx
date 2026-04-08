import { Link } from '@/i18n/routing';
import { ItemProps, ImageProps } from '@/lib/types';
import { FC } from 'react';

type Props = {
  backgroundImage?: ImageProps;
  subTitle: string;
  title: string;
  text: string;
  buttons: Array<{ href: string; label: string; variant?: 'primary' | 'outline' }>;
};

const HeroBanner: FC<ItemProps<Props>> = async ({ data }) => {
  return (
    <section className="bg-charcoal relative flex min-h-[60vh] items-center overflow-hidden text-white">
      <div className="from-charcoal via-charcoal/90 to-charcoal/60 absolute inset-0 z-10 bg-linear-to-r" />
      {data.backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${data.backgroundImage.src}')`,
            opacity: 0.3,
          }}
        />
      )}
      <div className="relative z-20 mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="max-w-xl">
          {data.subTitle && (
            <p className="text-terra mb-4 text-sm font-medium tracking-widest uppercase">
              {data.subTitle}
            </p>
          )}
          <h1
            className="mb-6 text-4xl leading-tight font-light md:text-6xl"
            dangerouslySetInnerHTML={{ __html: data.title || '' }}
          />
          <p className="mb-8 text-lg leading-relaxed text-white/70">{data.text}</p>
          {data.buttons && (
            <div className="flex gap-4">
              {data.buttons.map((btn) => (
                <Link
                  key={btn.href}
                  href={btn.href}
                  className={
                    btn.variant === 'primary'
                      ? 'text-charcoal hover:bg-cream rounded-sm bg-white px-6 py-3 text-sm font-medium transition-colors'
                      : 'rounded-sm border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10'
                  }
                >
                  {btn.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
