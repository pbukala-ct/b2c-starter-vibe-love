import { CartProvider } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCategoryTree } from '@/lib/ct/categories';
import { getSession, getLocale } from '@/lib/session';
import { getCart } from '@/lib/ct/cart';
import { LocaleProvider } from '@/context/LocaleContext';
import { SWRConfig } from 'swr';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { KEY_CART, KEY_ACCOUNT } from '@/lib/cache-keys';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const [categories, session, messages, { country: initialCountry }] = await Promise.all([
    getCategoryTree(),
    getSession(),
    getMessages(),
    getLocale(),
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
  );
}
