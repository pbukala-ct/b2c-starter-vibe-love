import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getStoreScopedCategories } from '@/lib/ct/categories';
import { getSession, getLocale } from '@/lib/session';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-playfair',
});
import { getCart } from '@/lib/ct/cart';
import { LocaleProvider } from '@/context/LocaleContext';
import { SWRConfig } from 'swr';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { KEY_CART, KEY_ACCOUNT } from '@/lib/cache-keys';

export const metadata: Metadata = {
  title: { template: '%s | Vibe Love', default: 'Vibe Love – The Art of Home' },
  description: 'Curated home accessories and décor, crafted for the spaces you love most.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, messages, { country: initialCountry, locale, currency, country }] = await Promise.all([
    getSession(),
    getMessages(),
    getLocale(),
  ]);
  const categories = await getStoreScopedCategories(locale, currency, country);

  let initialCart = null;
  if (session.cartId) {
    try {
      const cart = await getCart(session.cartId);
      if (cart.cartState === 'Active') {
        initialCart = cart;
      }
    } catch {
      // Cart not found — initialCart stays null
    }
  }

  const initialUser = session.customerId
    ? {
        id: session.customerId,
        email: session.customerEmail || '',
        firstName: session.customerFirstName || '',
        lastName: session.customerLastName || '',
      }
    : null;

  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SWRConfig value={{ fallback: { [KEY_CART]: initialCart, [KEY_ACCOUNT]: initialUser } }}>
            <LocaleProvider initialCountry={initialCountry}>
              <CartProvider>
                <Header categories={categories} />
                <main className="min-h-screen">{children}</main>
                <Footer />
              </CartProvider>
            </LocaleProvider>
          </SWRConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
