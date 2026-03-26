import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySku } from '@/lib/ct/search';
import { getCategoryById } from '@/lib/ct/categories';
import { getRecurrencePolicies } from '@/lib/ct/auth';
import { formatMoney, getLocalizedString, toUrlLocale } from '@/lib/utils';
import { getLocale } from '@/lib/session';
import { getTranslations } from 'next-intl/server';
import PDPActions from '@/components/product/PDPActions';
import ProductImageCarousel from '@/components/product/ProductImageCarousel';
import VariantSelector from '@/components/product/VariantSelector';
import type { VariantAttributeGroup } from '@/components/product/VariantSelector';
import {
  VARIANT_SELECTOR_BLOCKLIST,
  VARIANT_RENDERER_MAP,
  VARIANT_COLOR_CODE_ATTR,
  VARIANT_SORT_ORDER,
  PDP_INFO_ATTRIBUTES,
} from '@/lib/ct/variant-config';
import { getAttributeLabels } from '@/lib/ct/facets';
import { Metadata } from 'next';
import { Price } from '@commercetools/platform-sdk';

interface PageProps {
  params: Promise<{ slug: string; sku: string }>;
}

/** Convert any CT attribute value to a human-readable string. */
function attrToLabel(value: unknown, locale: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj[locale] === 'string') return obj[locale] as string;
    if (typeof obj['en-US'] === 'string') return obj['en-US'] as string;
    if (obj.label !== undefined) return attrToLabel(obj.label, locale);
    if (typeof obj.key === 'string') return obj.key;
  }
  return '';
}

/** Derive a display label from a CT attribute name. */
function deriveDisplayLabel(name: string): string {
  return name
    .replace(/-label$/, '')
    .replace(/^search-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface SerializedVariant {
  sku: string;
  attrs: Record<string, string>;
  colorCodes: Record<string, string>;
  isAvailable: boolean;
}

/** Find the best-matching variant SKU for a given attribute value selection. */
function findBestMatch(
  variants: SerializedVariant[],
  currentAttrs: Record<string, string>,
  forAttr: string,
  targetLabel: string
): string {
  const candidates = variants.filter((v) => v.attrs[forAttr] === targetLabel);
  if (!candidates.length) return '';
  return candidates
    .map((v) => ({
      sku: v.sku,
      score: Object.entries(currentAttrs).filter(([k, val]) => k !== forAttr && v.attrs[k] === val)
        .length,
    }))
    .reduce((best, c) => (c.score > best.score ? c : best)).sku;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sku } = await params;
  const { currency, locale, country } = await getLocale();
  const product = await getProductBySku(sku, locale, currency, country);
  if (!product) return { title: 'Product Not Found' };
  return { title: getLocalizedString(product.name, locale) };
}

export default async function ProductPage({ params }: PageProps) {
  const { sku, slug } = await params;
  const { country, currency, locale } = await getLocale();
  const lp = (p: string) => `/${toUrlLocale(country)}${p}`;
  const t = await getTranslations('product');
  const tCommon = await getTranslations('common');
  const [product, policiesResult, attributeLabels] = await Promise.all([
    getProductBySku(sku, locale, currency, country),
    getRecurrencePolicies(),
    getAttributeLabels(locale),
  ]);
  if (!product) notFound();

  const allVariants = [product.masterVariant, ...(product.variants || [])];
  const variant = allVariants.find((v) => v?.sku === sku) || product.masterVariant;

  const name = getLocalizedString(product.name, locale);
  const description = getLocalizedString(product.description, locale);
  const images = variant?.images || product.masterVariant?.images || [];
  const attrs = variant?.attributes || product.masterVariant?.attributes || [];
  const getAttr = (n: string) => attrs.find((a: { name: string }) => a.name === n)?.value;

  // variant.price is the CT-embedded price (currency/country selected by CT) and is the only
  // source that carries the discounted field. variant.prices entries are raw and never have it.
  const regularPrice =
    variant?.price ||
    variant?.prices?.find((p: Price) => !p.recurrencePolicy && p.value.currencyCode === currency);
  const displayPrice = regularPrice?.discounted?.value ?? regularPrice?.value;
  const discountName = regularPrice?.discounted?.discount?.obj?.name
    ? getLocalizedString(regularPrice.discounted.discount.obj.name, locale)
    : null;
  const recurringPrices = variant?.prices?.filter((p: Price) => !!p.recurrencePolicy) || [];
  const recurrencePolicies = policiesResult.results || [];

  const infoSections = PDP_INFO_ATTRIBUTES.map((name) => ({
    name,
    label: attributeLabels[name] ?? deriveDisplayLabel(name),
    text: (() => {
      const v = getAttr(name);
      return v ? getLocalizedString(v as Record<string, string>, locale) : '';
    })(),
  })).filter((s) => s.text);
  const isSubscriptionEligible = getAttr('subscription-eligible') === true;

  let categoryName = '',
    categorySlug = '';
  if (product.categories?.[0]) {
    const cat = await getCategoryById(product.categories[0].id);
    if (cat) {
      categoryName = getLocalizedString(cat.name, locale);
      categorySlug = getLocalizedString(cat.slug, locale);
    }
  }

  // --- Variant selector data ---
  const serializedVariants: SerializedVariant[] = allVariants
    .filter((v) => v?.sku)
    .map((v) => {
      const variantAttrs = v!.attributes || [];
      const variantAttrMap: Record<string, string> = {};
      const colorCodes: Record<string, string> = {};

      for (const a of variantAttrs) {
        const label = attrToLabel(a.value, locale);
        if (label) variantAttrMap[a.name] = label;
        if ((a.name === 'color-code' || a.name === 'finish-code') && typeof a.value === 'string') {
          colorCodes[a.name] = a.value;
        }
      }

      return {
        sku: v!.sku!,
        attrs: variantAttrMap,
        colorCodes,
        isAvailable: v!.availability?.isOnStock === true,
      };
    });

  const currentVariant = serializedVariants.find((v) => v.sku === sku);
  const isSoldOut = !(currentVariant?.isAvailable ?? false);
  const currentAttrs = currentVariant?.attrs ?? {};
  const urlPrefix = lp(`/${slug}/p/`);

  // Find attributes that vary across variants and are not blocked
  const attrValueSets: Record<string, Set<string>> = {};
  for (const v of serializedVariants) {
    for (const [attrName, label] of Object.entries(v.attrs)) {
      if (VARIANT_SELECTOR_BLOCKLIST.includes(attrName)) continue;
      if (!attrValueSets[attrName]) attrValueSets[attrName] = new Set();
      attrValueSets[attrName].add(label);
    }
  }

  // All selectable attribute names (used for cross-attribute availability filtering)
  const selectableAttrNames = Object.entries(attrValueSets)
    .filter(([, values]) => values.size > 1)
    .map(([name]) => name);

  const variantGroups: VariantAttributeGroup[] = Object.entries(attrValueSets)
    .filter(([, values]) => values.size > 1)
    .sort(([a], [b]) => {
      const ai = VARIANT_SORT_ORDER.indexOf(a);
      const bi = VARIANT_SORT_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([attrName]) => {
      const renderer = VARIANT_RENDERER_MAP[attrName] ?? 'pill';
      const codeAttr = VARIANT_COLOR_CODE_ATTR[attrName];
      const seen = new Set<string>();

      const options = serializedVariants
        .filter((v) => v.attrs[attrName])
        .reduce<VariantAttributeGroup['options']>((acc, v) => {
          const label = v.attrs[attrName];
          if (seen.has(label)) return acc;
          seen.add(label);
          const targetSku = findBestMatch(serializedVariants, currentAttrs, attrName, label);
          if (!targetSku) return acc;
          const isAvailable = serializedVariants.some(
            (sv) =>
              sv.attrs[attrName] === label &&
              sv.isAvailable &&
              selectableAttrNames
                .filter((a) => a !== attrName)
                .every((a) => !currentAttrs[a] || sv.attrs[a] === currentAttrs[a])
          );
          acc.push({
            label,
            targetUrl: `${urlPrefix}${targetSku}`,
            colorCode: codeAttr ? v.colorCodes[codeAttr] : undefined,
            isActive: label === currentAttrs[attrName],
            isAvailable,
          });
          return acc;
        }, []);

      return {
        name: attrName,
        displayLabel: attributeLabels[attrName] ?? deriveDisplayLabel(attrName),
        currentLabel: currentAttrs[attrName] ?? '',
        renderer,
        options,
      };
    });

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
        <ProductImageCarousel images={images} name={name} />

        <div className="space-y-6">
          <div>
            <h1 className="text-charcoal mb-3 text-2xl font-semibold lg:text-3xl">{name}</h1>
            {regularPrice && displayPrice && (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <p
                    className={`text-2xl font-medium ${regularPrice.discounted ? 'text-terra' : 'text-charcoal'}`}
                  >
                    {formatMoney(displayPrice.centAmount, displayPrice.currencyCode)}
                  </p>
                  {regularPrice.discounted && (
                    <p className="text-charcoal-light text-lg line-through">
                      {formatMoney(regularPrice.value.centAmount, regularPrice.value.currencyCode)}
                    </p>
                  )}
                </div>
                {discountName && (
                  <span className="bg-terra inline-block rounded-sm px-2 py-0.5 text-xs font-medium text-white">
                    {discountName}
                  </span>
                )}
              </div>
            )}
          </div>

          <VariantSelector groups={variantGroups} />

          {regularPrice && (
            <PDPActions
              productId={product.id}
              variantId={variant?.id || product.masterVariant.id}
              regularPrice={regularPrice}
              recurringPrices={recurringPrices}
              isSubscriptionEligible={isSubscriptionEligible && recurrencePolicies.length > 0}
              isSoldOut={isSoldOut}
            />
          )}

          {description && (
            <div>
              <h2 className="text-charcoal mb-2 text-xs font-semibold tracking-wider uppercase">
                {t('description')}
              </h2>
              <p className="text-charcoal-light text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {infoSections.map((section) => (
            <div key={section.name}>
              <h2 className="text-charcoal mb-2 text-xs font-semibold tracking-wider uppercase">
                {section.label}
              </h2>
              <pre className="text-charcoal-light font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {section.text}
              </pre>
            </div>
          ))}

          <div className="border-border space-y-2 border-t pt-4">
            {[t('freeShipping'), t('splitShipments'), t('shipsWithin')].map((line) => (
              <div key={line} className="text-charcoal-light flex items-center gap-2 text-xs">
                <svg
                  className="text-sage h-4 w-4 shrink-0"
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
