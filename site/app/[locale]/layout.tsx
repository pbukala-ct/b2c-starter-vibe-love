import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { LocaleProvider } from '@/context/LocaleContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCategoryTree } from '@/lib/ct/categories';
import { getSession } from '@/lib/session';
import { getCart } from '@/lib/ct/cart';

const URL_LOCALE_TO_COUNTRY: Record<string, string> = {
  'en-us': 'US',
  'en-gb': 'GB',
  'de-de': 'DE',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const country = URL_LOCALE_TO_COUNTRY[locale];
  if (!country) notFound();

  const [categories, session, messages] = await Promise.all([
    getCategoryTree(),
    getSession(),
    getMessages(),
  ]);

  let initialCart = null;
  if (session.cartId) {
    try {
      const cart = await getCart(session.cartId);
      if (cart.cartState === 'Active') initialCart = cart;
    } catch { /* cart not found */ }
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
      <LocaleProvider initialCountry={country}>
        <AuthProvider initialUser={initialUser}>
          <CartProvider initialCart={initialCart}>
            <Header categories={categories} />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
