---
name: add-homepage-element
description: How to add a new element (banner, section, custom block) to the homepage layout system.
---

# Add a New Homepage Element

The homepage is driven by a layout stub in `site/lib/layout.ts`. Each page is composed of `LayoutSection → LayoutElement → LayoutItem`. Adding a new element means: (1) creating a React component, (2) registering it in the item registry, and (3) adding an entry to `getPageSections`.

---

## Architecture overview

```
site/lib/layout.ts          ← getPageSections() builds the page config
site/components/grid/
  Grid.tsx                  ← outer 12-column grid wrapper
  Cell.tsx                  ← single column-spanning cell (col-span-N + device visibility)
  Item.tsx                  ← registry lookup → renders the right component
  MissingItem.tsx           ← dev-mode fallback for unknown layoutItemType
site/components/home/
  HeroBanner.tsx            ← layoutItemType: 'content/hero'
  Section.tsx               ← layoutItemType: 'content/section'
  MessageBanner.tsx         ← layoutItemType: 'content/message'
```

**Data flow:**

```
getPageSections()
  → returns LayoutSection[]
    → each section has layoutElements[]
      → each element has configuration (size, device visibility) + items[]
        → each item has layoutItemType + configuration (the component's props)
```

`Item.tsx` maps `layoutItemType` to a React component and passes `configuration` as `data` prop.

Localized strings in the configuration (e.g. `{ 'en-US': '...', 'de-DE': '...' }`) are automatically resolved to plain strings by `localizeConfig()` before the sections are returned.

---

## Step 1 — Create the component

Components live in `site/components/home/`. They receive `ItemProps<YourProps>` where `data` is your typed configuration.

```typescript
// site/components/home/Promo.tsx
import { FC } from 'react';
import { Link } from '@/i18n/routing';
import { ItemProps } from '@/lib/types';

type Props = {
  title: string;
  subtitle?: string;
  cta?: { label: string; target: string };
  backgroundImage?: { src: string };
};

const Promo: FC<ItemProps<Props>> = ({ data }) => {
  return (
    <section className="bg-cream px-4 py-12 text-center">
      <h2 className="text-charcoal text-3xl font-semibold">{data.title}</h2>
      {data.subtitle && <p className="text-charcoal-light mt-2">{data.subtitle}</p>}
      {data.cta && (
        <Link href={data.cta.target} className="text-terra mt-4 inline-block text-sm hover:underline">
          {data.cta.label}
        </Link>
      )}
    </section>
  );
};

export default Promo;
```

**Rules:**
- Always type `Props` explicitly — don't use `any` or `Record<string, unknown>`
- All localized strings arrive as plain `string` (already resolved by `localizeConfig`)
- If the component fetches additional data, make it `async` (server component)

---

## Step 2 — Register in Item.tsx

Add a dynamic import and a mapping entry in `site/components/grid/Item.tsx`:

```typescript
// site/components/grid/Item.tsx
const Promo = dynamic(() => import('../home/Promo'));

const mappings: ItemRegistry = {
  'content/hero': HeroBanner,
  'content/section': Section,
  'content/message': Message,
  'content/promo': Promo,   // ← add this
};
```

Use `dynamic()` (Next.js dynamic import) for all homepage components — it keeps the initial bundle small and enables per-item code splitting.

The `layoutItemType` string is the key. Use the convention `content/<name>`.

---

## Step 3 — Add the item to getPageSections

Open `site/lib/layout.ts` and add your item inside the `items` array of the appropriate `layoutElement`:

```typescript
// site/lib/layout.ts
{
  layoutItemType: 'content/promo',
  configuration: {
    mobile: true,
    tablet: true,
    desktop: true,
    title: {
      'en-US': 'Summer Sale',
      'en-GB': 'Summer Sale',
      'de-DE': 'Sommerschlussverkauf',
    },
    subtitle: {
      'en-US': 'Up to 40% off selected items.',
      'en-GB': 'Up to 40% off selected items.',
      'de-DE': 'Bis zu 40% Rabatt auf ausgewählte Artikel.',
    },
    cta: {
      label: {
        'en-US': 'Shop now →',
        'en-GB': 'Shop now →',
        'de-DE': 'Jetzt einkaufen →',
      },
      target: '/search?sale=true',
    },
  },
},
```

**Localization:** Any object whose keys are all `xx-XX` locale codes is automatically resolved to a plain string by `localizeConfig()`. You never need to call `getLocalizedString` inside a homepage component.

**Device visibility:** The `mobile`, `tablet`, `desktop` booleans on `configuration` control whether the item is rendered on each breakpoint (handled by `deviceVisibility()` in `Item.tsx`). Set to `false` to hide on a specific device size.

---

## Step 4 — Control column width (optional)

Each `layoutElement` wraps its items in a `Cell` component. The `size` in `configuration` maps to `col-span-N` (1–12) in the 12-column grid. To place two elements side by side, use two separate `layoutElement` entries:

```typescript
layoutElements: [
  {
    configuration: { desktop: true, mobile: true, tablet: true, size: 8 },
    items: [{ layoutItemType: 'content/promo', configuration: { ... } }],
  },
  {
    configuration: { desktop: true, mobile: true, tablet: true, size: 4 },
    items: [{ layoutItemType: 'content/hero', configuration: { ... } }],
  },
],
```

`col-span-1` through `col-span-12` are statically included in `globals.css` via `@source inline(...)` so Tailwind never purges them even though they're constructed dynamically.

---

## Fetching data for a homepage element

If your component needs CT data, fetch it in `getPageSections` and pass the results as part of `configuration.items`:

```typescript
// site/lib/layout.ts
const featured = await searchProducts({ limit: 4, currency, country, locale });

{
  layoutItemType: 'content/section',
  configuration: {
    mobile: true, tablet: true, desktop: true,
    title: { 'en-US': 'Featured', 'de-DE': 'Empfohlen', 'en-GB': 'Featured' },
    items: featured.products,
  },
},
```

`getPageSections` already receives `locale`, `currency`, and `country` — use them for any CT call.

---

## Checklist

- [ ] Component created in `site/components/home/`
- [ ] Props typed explicitly (no `any`)
- [ ] Dynamic import added to `site/components/grid/Item.tsx`
- [ ] `layoutItemType` registered in the `mappings` object
- [ ] Entry added to `getPageSections` in `site/lib/layout.ts`
- [ ] Localized strings use `{ 'en-US': ..., 'en-GB': ..., 'de-DE': ... }` objects (resolved automatically)
- [ ] `mobile`, `tablet`, `desktop` booleans set appropriately
