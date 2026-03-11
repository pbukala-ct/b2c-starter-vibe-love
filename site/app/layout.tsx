import type { Metadata } from 'next';
import './globals.css';
import { LocaleProvider } from '@/context/LocaleContext';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCategoryTree } from '@/lib/ct/categories';
import { getSession } from '@/lib/session';
import { getCart } from '@/lib/ct/cart';

export const metadata: Metadata = {
  title: { template: '%s | Vibe Home', default: 'Vibe Home – Curated for Modern Living' },
  description: 'Premium furniture and home goods. Curated for modern living.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, session] = await Promise.all([
    getCategoryTree(),
    getSession(),
  ]);

  let initialCart = null;
  if (session.cartId) {
    try {
      initialCart = await getCart(session.cartId);
    } catch {
      // Cart not found
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
        <LocaleProvider>
          <AuthProvider initialUser={initialUser}>
            <CartProvider initialCart={initialCart}>
              <Header categories={categories} />
              <main className="min-h-screen">{children}</main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
