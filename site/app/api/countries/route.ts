import { NextResponse } from 'next/server';
import { apiRoot } from '@/lib/ct/client';
import { COUNTRY_CONFIG } from '@/lib/utils';

export async function GET() {
  const project = await apiRoot.get().execute();
  const countries = project.body.countries.map((code: string) => ({
    code,
    ...(COUNTRY_CONFIG[code] || { currency: 'USD', locale: 'en-US', name: code, flag: '🌍' }),
  }));
  return NextResponse.json({ countries });
}
