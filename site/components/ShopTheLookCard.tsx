import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import type { ShopTheLookCustomObject } from '@/lib/types';

interface ShopTheLookCardProps {
  bundle: ShopTheLookCustomObject;
  previewImages: string[];
}

export default function ShopTheLookCard({ bundle, previewImages }: ShopTheLookCardProps) {
  const t = useTranslations('shopTheLook');
  const { name, description, products } = bundle.value;
  const images = previewImages.slice(0, 3);

  return (
    <Link
      href={`/shop-the-look/${bundle.key}`}
      className="group border-border flex flex-col overflow-hidden rounded-sm border bg-white transition-shadow hover:shadow-md"
    >
      {/* Hero — real product image collage */}
      <div className="bg-cream relative flex h-52 items-center justify-center overflow-hidden">
        {images.length > 0 ? (
          <div className="flex h-full w-full">
            {images.length === 1 && (
              <div className="relative h-full w-full">
                <Image
                  src={images[0]}
                  alt={name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            {images.length === 2 && images.map((url, i) => (
              <div key={i} className="relative h-full w-1/2 overflow-hidden">
                <div className="absolute inset-0 border-r border-white last:border-r-0" />
                <Image
                  src={url}
                  alt={`${name} product ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 17vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
            {images.length >= 3 && (
              <>
                {/* Left — large half */}
                <div className="relative h-full w-1/2 overflow-hidden border-r border-white">
                  <Image
                    src={images[0]}
                    alt={`${name} product 1`}
                    fill
                    sizes="(max-width: 640px) 50vw, 17vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Right — two stacked quarters */}
                <div className="flex h-full w-1/2 flex-col">
                  <div className="relative h-1/2 overflow-hidden border-b border-white">
                    <Image
                      src={images[1]}
                      alt={`${name} product 2`}
                      fill
                      sizes="(max-width: 640px) 50vw, 17vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative h-1/2 overflow-hidden">
                    <Image
                      src={images[2]}
                      alt={`${name} product 3`}
                      fill
                      sizes="(max-width: 640px) 50vw, 17vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* No images — neutral placeholder with subtle pattern */
          <div className="bg-cream flex h-full w-full items-center justify-center">
            <div className="grid grid-cols-3 gap-2 opacity-20">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-charcoal h-8 w-8 rounded-sm" />
              ))}
            </div>
          </div>
        )}

        {/* Product count badge */}
        <span className="bg-charcoal/70 absolute bottom-2 right-2 rounded-sm px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
          {t('products', { count: products.length })}
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-charcoal group-hover:text-terra mb-1 text-base font-semibold transition-colors">
          {name}
        </h2>
        {description && (
          <p className="text-charcoal-light mb-3 line-clamp-2 text-sm">{description}</p>
        )}
        <span className="text-terra mt-auto text-xs font-medium group-hover:underline">
          {t('navLink')} →
        </span>
      </div>
    </Link>
  );
}
