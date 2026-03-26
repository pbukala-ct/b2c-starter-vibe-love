// Shared domain types for use in frontend components.
// Components must import types from here — never directly from @/lib/ct/*.

export interface Category {
  id: string;
  name: Record<string, string>;
  slug: Record<string, string>;
  parent?: { typeId: string; id: string };
  orderHint?: string;
  children?: Category[];
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  metaKeywords?: Record<string, string>;
}
