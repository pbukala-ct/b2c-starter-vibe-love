import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySku } from '@/lib/ct/search';
import { getCategoryById } from '@/lib/ct/categories';
import { getRecurrencePolicies } from '@/lib/ct/auth';
import { formatMoney, getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { getTranslations } from 'next-intl/server';
import SubscribeAndSave from '@/components/product/SubscribeAndSave';
import AddToCartButton from '@/components/product/AddToCartButton';
import type { Price } from '@/lib/ct/search';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string; sku: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sku } = await params;
  const { currency, locale, country } = await getLocale();
  const product = await getProductBySku(sku, locale, currency, country);
  if (!product) return { title: 'Product Not Found' };
  return { title: getLocalizedString(product.name, locale) };
}

export default async function ProductPage({ params }: PageProps) {
  const { sku } = await params;
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const t = await getTranslations('product');
  const tCommon = await getTranslations('common');
  const [product, policiesResult] = await Promise.all([
    getProductBySku(sku, locale, currency, country),
    getRecurrencePolicies(),
  ]);
  if (!product) notFound();

  // Find the variant matching the SKU (CT returns the full product, so locate the right variant)
  const allVariants = [product.masterVariant, ...(product.variants || [])];
  const variant = allVariants.find((v) => v?.sku === sku) || product.masterVariant;

  const name = getLocalizedString(product.name, locale);
  const description = getLocalizedString(product.description, locale);
  const images = variant?.images || product.masterVariant?.images || [];
  const attrs = variant?.attributes || product.masterVariant?.attributes || [];
  const getAttr = (n: string) => attrs.find((a: { name: string }) => a.name === n)?.value;

  const regularPrice =
    variant?.prices?.find((p: Price) => !p.recurrencePolicy && p.value.currencyCode === currency) ||
    variant?.price;
  const recurringPrices = variant?.prices?.filter((p: Price) => !!p.recurrencePolicy) || [];
  const recurrencePolicies = policiesResult.results || [];

  const specText = (() => {
    const v = getAttr('productspec') || getAttr('product-spec');
    return v ? getLocalizedString(v as Record<string, string>, locale) : '';
  })();
  const colorText = (() => {
    const v = getAttr('color-label');
    return v ? getLocalizedString(v as Record<string, string>, locale) : '';
  })();
  const sizeText = (() => {
    const v = getAttr('size');
    return v ? getLocalizedString(v as Record<string, string>, locale) : '';
  })();
  const isSubscriptionEligible = getAttr('subscription-eligible') === true;

  let categoryName = '',
    categorySlug = '';
  if (product.categories?.[0]) {
    const cat = await getCategoryById(product.categories[0].id);
    if (cat) {
      categoryName = getLocalizedString(cat.name, 'en-US');
      categorySlug = cat.slug['en-US'] || Object.values(cat.slug)[0];
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav className="text-charcoal-light mb-6 flex items-center gap-2 text-xs">
        <Link href={lp('/')} className="hover:text-terra">
          {tCommon('home')}
        </Link>
        {categorySlug && (
          <>
            <span>/</span>
            <Link href={lp(`/category/${categorySlug}`)} className="hover:text-terra">
              {categoryName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-charcoal line-clamp-1">{name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              <div className="bg-cream-dark relative aspect-square overflow-hidden rounded-sm">
                <Image
                  src={images[0].url}
                  alt={name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1, 5).map((img, i) => (
                    <div
                      key={i}
                      className="bg-cream-dark relative aspect-square overflow-hidden rounded-sm"
                    >
                      <Image
                        src={img.url}
                        alt={`${name} ${i + 2}`}
                        fill
                        className="object-cover"
                        sizes="25vw"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-cream-dark text-border flex aspect-square items-center justify-center rounded-sm">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-charcoal mb-3 text-2xl font-semibold lg:text-3xl">{name}</h1>
            {regularPrice && (
              <p className="text-charcoal text-2xl font-medium">
                {formatMoney(regularPrice.value.centAmount, regularPrice.value.currencyCode)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {colorText && (
              <span className="border-border text-charcoal-light rounded-full border px-3 py-1 text-xs">
                {t('color')}: <span className="text-charcoal">{colorText}</span>
              </span>
            )}
            {sizeText && (
              <span className="border-border text-charcoal-light rounded-full border px-3 py-1 text-xs">
                {t('size')}: <span className="text-charcoal">{sizeText}</span>
              </span>
            )}
          </div>

          {regularPrice &&
            (isSubscriptionEligible &&
            recurringPrices.length > 0 &&
            recurrencePolicies.length > 0 ? (
              <SubscribeAndSave
                productId={product.id}
                variantId={variant?.id || product.masterVariant.id}
                regularPrice={regularPrice}
                recurringPrices={recurringPrices}
                recurrencePolicies={recurrencePolicies}
              />
            ) : (
              <AddToCartButton
                productId={product.id}
                variantId={variant?.id || product.masterVariant.id}
              />
            ))}

          {description && (
            <div>
              <h2 className="text-charcoal mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('description')}
              </h2>
              <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {specText && (
            <div>
              <h2 className="text-charcoal mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('specifications')}
              </h2>
              <pre className="text-charcoal-light font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {specText}
              </pre>
            </div>
          )}

          <div className="border-border space-y-2 border-t pt-4">
            {[t('freeShipping'), t('splitShipments'), t('shipsWithin')].map((line) => (
              <div key={line} className="text-charcoal-light flex items-center gap-2 text-xs">
                <svg
                  className="text-sage h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
