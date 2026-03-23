import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCategoryTree } from '@/lib/ct/categories';
import { getSession } from '@/lib/session';
import { getCart } from '@/lib/ct/cart';
import { LocaleProvider } from '@/context/LocaleContext';
import { SWRConfig } from 'swr';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { KEY_CART, KEY_ACCOUNT } from '@/lib/cache-keys';

export const metadata: Metadata = {
  title: { template: '%s | Vibe Home', default: 'Vibe Home – Curated for Modern Living' },
  description: 'Premium furniture and home goods. Curated for modern living.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, session, messages] = await Promise.all([
    getCategoryTree(),
    getSession(),
    getMessages(),
  ]);

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SWRConfig value={{ fallback: { [KEY_CART]: initialCart, [KEY_ACCOUNT]: initialUser } }}>
            <LocaleProvider>
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
