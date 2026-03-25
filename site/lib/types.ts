// Shared domain types for use in frontend components.
// Components must import types from here — never directly from @/lib/ct/*.
// CT modules remain the source of truth; this file is the public surface.
export type { Category } from '@/lib/ct/categories';
export type { ProductProjection, Price } from '@/lib/ct/search';
