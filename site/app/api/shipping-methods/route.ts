import { NextRequest, NextResponse } from 'next/server';
import { getShippingMethods } from '@/lib/ct/cart';
import { getLocale } from '@/lib/session';

export async function GET(_req: NextRequest) {
  const { currency } = await getLocale();

  try {
    const result = await getShippingMethods();
    const methods = result.results || [];

    // Return methods with the matching rate for the requested currency/country
    const formatted = methods
      .map(
        (sm: {
          id: string;
          name: string;
          localizedDescription?: Record<string, string>;
          zoneRates: Array<{
            shippingRates: Array<{
              price: { currencyCode: string; centAmount: number };
              freeAbove?: { centAmount: number };
              isMatching?: boolean;
            }>;
          }>;
        }) => {
          // Find the matching rate for this currency
          let matchingRate = null;
          for (const zr of sm.zoneRates) {
            for (const rate of zr.shippingRates) {
              if (rate.price.currencyCode === currency && rate.isMatching !== false) {
                matchingRate = rate;
                break;
              }
              if (rate.price.currencyCode === currency && !matchingRate) {
                matchingRate = rate;
              }
            }
            if (matchingRate) break;
          }

          return {
            id: sm.id,
            name: sm.name,
            description: sm.localizedDescription?.['en-US'] || sm.localizedDescription?.['en-GB'],
            price: matchingRate?.price || null,
            freeAbove: matchingRate?.freeAbove || null,
          };
        }
      )
      .filter((sm: { price: unknown }) => sm.price !== null);

    return NextResponse.json({ shippingMethods: formatted });
  } catch (e) {
    console.error('Failed to fetch shipping methods:', e);
    return NextResponse.json({ shippingMethods: [] });
  }
}
