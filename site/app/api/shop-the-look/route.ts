import { NextResponse } from 'next/server';
import { getShopTheLookBundles } from '@/lib/ct/shop-the-look';

export async function GET() {
  const bundles = await getShopTheLookBundles();
  return NextResponse.json({ bundles });
}
