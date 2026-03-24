import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/ct/search';
import { getCategoryById } from '@/lib/ct/categories';
import { formatMoney, getLocalizedString } from '@/lib/utils';
import { getLocale } from '@/lib/locale';
import SubscribeAndSave from '@/components/product/SubscribeAndSave';
import AddToCartButton from '@/components/product/AddToCartButton';
import AddToWishlistButton from '@/components/product/AddToWishlistButton';
import type { Price } from '@/lib/ct/search';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { locale, currency, country } = await getLocale();
  const product = await getProductBySlug(slug, locale, currency, country);
  if (!product) return { title: 'Product Not Found' };
  return { title: getLocalizedString(product.name, locale) };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const { country, currency, locale } = await getLocale();
  const product = await getProductBySlug(slug, locale, currency, country);
  if (!product) notFound();

  const name = getLocalizedString(product.name, locale);
  const description = getLocalizedString(product.description, locale);
  const images = product.masterVariant?.images || [];
  const attrs = product.masterVariant?.attributes || [];
  const getAttr = (n: string) => attrs.find((a: { name: string }) => a.name === n)?.value;

  const regularPrice = product.masterVariant?.prices?.find(
    (p: Price) => !p.recurrencePolicy && p.value.currencyCode === currency
  ) || product.masterVariant?.price;
  const recurringPrices = product.masterVariant?.prices?.filter((p: Price) => !!p.recurrencePolicy) || [];
  

  const specText = (() => { const v = getAttr('productspec') || getAttr('product-spec'); return v ? getLocalizedString(v as Record<string,string>, locale) : ''; })();
  const colorText = (() => { const v = getAttr('color-label'); return v ? getLocalizedString(v as Record<string,string>, locale) : ''; })();
  const sizeText = (() => { const v = getAttr('size'); return v ? getLocalizedString(v as Record<string,string>, locale) : ''; })();

  let categoryName = '', categorySlug = '';
  if (product.categories?.[0]) {
    const cat = await getCategoryById(product.categories[0].id);
    if (cat) { categoryName = getLocalizedString(cat.name, locale); categorySlug = getLocalizedString(cat.slug) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-xs text-charcoal-light mb-6">
        <Link href="/" className="hover:text-terra">Home</Link>
        {categorySlug && (<><span>/</span><Link href={`/category/${categorySlug}`} className="hover:text-terra">{categoryName}</Link></>)}
        <span>/</span>
        <span className="text-charcoal line-clamp-1">{name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-3">
          {images.length > 0 ? (
            <>
              <div className="relative aspect-square bg-cream-dark rounded-sm overflow-hidden">
                <Image src={images[0].url} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1, 5).map((img, i) => (
                    <div key={i} className="relative aspect-square bg-cream-dark rounded-sm overflow-hidden">
                      <Image src={img.url} alt={`${name} ${i + 2}`} fill className="object-cover" sizes="25vw" />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-square bg-cream-dark rounded-sm flex items-center justify-center text-border">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-charcoal mb-3">{name}</h1>
            {regularPrice && <p className="text-2xl font-medium text-charcoal">{formatMoney(regularPrice.value.centAmount, regularPrice.value.currencyCode)}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {colorText && <span className="border border-border px-3 py-1 rounded-full text-xs text-charcoal-light">Color: <span className="text-charcoal">{colorText}</span></span>}
            {sizeText && <span className="border border-border px-3 py-1 rounded-full text-xs text-charcoal-light">Size: <span className="text-charcoal">{sizeText}</span></span>}
          </div>

          {regularPrice && (
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                {recurringPrices.length > 0 ? (
                  <SubscribeAndSave
                    productId={product.id}
                    variantId={product.masterVariant.id}
                    regularPrice={regularPrice}
                    recurringPrices={recurringPrices}
                  />
                ) : (
                  <AddToCartButton productId={product.id} variantId={product.masterVariant.id} />
                )}
              </div>
              <AddToWishlistButton productId={product.id} sku={product.masterVariant.sku || ''} />
            </div>
          )}

          {description && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">Description</h2>
              <p className="text-sm text-charcoal-light leading-relaxed">{description}</p>
            </div>
          )}

          {specText && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal mb-2">Specifications</h2>
              <pre className="text-sm text-charcoal-light whitespace-pre-wrap font-sans leading-relaxed">{specText}</pre>
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-2">
            {['Free shipping on orders over $500', 'Split shipments available at checkout', 'Ships within 3–7 business days'].map(line => (
              <div key={line} className="flex items-center gap-2 text-xs text-charcoal-light">
                <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
