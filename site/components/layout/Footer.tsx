'use client';

import Link from 'next/link';
import { useLocale } from '@/context/LocaleContext';

export default function Footer() {
  const { localePath } = useLocale();

  return (
    <footer className="bg-charcoal text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-terra rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">V</span>
              </div>
              <span className="font-semibold text-lg">Vibe Home</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Curated furniture and home goods for modern living. Quality pieces that inspire.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/category/furniture')} className="hover:text-terra transition-colors">Furniture</Link></li>
              <li><Link href={localePath('/category/home-decor')} className="hover:text-terra transition-colors">Home Decor</Link></li>
              <li><Link href={localePath('/category/kitchen')} className="hover:text-terra transition-colors">Kitchen</Link></li>
              <li><Link href={localePath('/search?newArrival=true')} className="hover:text-terra transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Help</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/account/orders')} className="hover:text-terra transition-colors">Track Order</Link></li>
              <li><Link href={localePath('/account/subscriptions')} className="hover:text-terra transition-colors">Manage Subscriptions</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href={localePath('/login')} className="hover:text-terra transition-colors">Sign In</Link></li>
              <li><Link href={localePath('/register')} className="hover:text-terra transition-colors">Create Account</Link></li>
              <li><Link href={localePath('/account')} className="hover:text-terra transition-colors">My Account</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-white/50 text-xs">
          <p>© {new Date().getFullYear()} Vibe Home. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Powered by commercetools</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
