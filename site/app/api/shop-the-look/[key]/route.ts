import { NextRequest, NextResponse } from 'next/server';
import { getShopTheLookBundle, resolveBundleProducts } from '@/lib/ct/shop-the-look';
import { getLocale } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const bundle = await getShopTheLookBundle(key);

  if (!bundle || bundle.value.status !== 'active') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { locale, currency, country } = await getLocale();
  const products = await resolveBundleProducts(bundle.value, locale, currency, country);

  return NextResponse.json({ bundle, products });
}
