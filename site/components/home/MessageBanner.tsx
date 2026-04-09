import { Link } from '@/i18n/routing';
import type { CTA } from './types';
import { FC } from 'react';
import { ItemProps } from '@/lib/types';

interface Props {
  title: string;
  description: string;
  cta: CTA;
}

const MessageBanner: FC<ItemProps<Props>> = async ({ data }) => {
  return (
    <section className="bg-sage/10 border-sage/20 border-y py-12">
      <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
        <h2 className="text-charcoal mb-3 text-2xl font-semibold">{data.title}</h2>
        <p className="text-charcoal-light mx-auto mb-6 max-w-md">{data.description}</p>
        <Link
          href={data.cta.target}
          className="bg-sage hover:bg-sage/90 inline-block rounded-sm px-6 py-3 text-sm font-medium text-white transition-colors"
        >
          {data.cta.label}
        </Link>
      </div>
    </section>
  );
};

export default MessageBanner;
