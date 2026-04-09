---
name: variant-config
description: How to configure which product attributes appear as variant selectors on the PDP, and which appear as informational text sections — deny list, render style, color codes, sort order, availability filtering, and info attributes.
---

# Variant Attribute Configuration

All variant selector behaviour on the PDP is controlled by a single config file:

```
site/lib/ct/variant-config.ts
```

No code changes are needed for common adjustments — edit the config only.

---

## `VARIANT_SELECTOR_BLOCKLIST`

Attribute names that are **never** rendered as selectors, regardless of how many distinct values they have.

```typescript
export const VARIANT_SELECTOR_BLOCKLIST: string[] = [
  'new-arrival',
  'subscription-eligible',
  'productspec',
  'product-spec',
  'aiEnrichedDescription',
  'color-code',    // raw hex — exposed via color-label swatch
  'finish-code',   // raw hex — exposed via finish-label swatch
  'search-color',  // machine-readable search attr
  'search-finish', // machine-readable search attr
  'type',
];
```

**To hide an attribute:** add its CT attribute name to this array.

---

## `VARIANT_RENDERER_MAP`

Controls how each attribute is rendered. Options: `'pill'` (default) or `'color'` (circular swatch).

```typescript
export const VARIANT_RENDERER_MAP: Record<string, VariantRenderer> = {
  'color-label': 'color',
  'finish-label': 'color',
};
```

Attributes not listed here default to `'pill'` (text button).

---

## `VARIANT_COLOR_CODE_ATTR`

For `'color'` renderer attributes, maps the **display attribute** to the **companion attribute** that holds the hex background color.

```typescript
export const VARIANT_COLOR_CODE_ATTR: Record<string, string> = {
  'color-label': 'color-code',
  'finish-label': 'finish-code',
};
```

- The display attribute value (e.g. `"Natural"`) is used as the swatch tooltip text and as a 2-character text fallback when no hex code is present.
- The code attribute value (e.g. `"#F5EDD8"`) is used as `backgroundColor`.

---

## `VARIANT_SORT_ORDER`

Explicit left-to-right display order for attribute groups. Attributes not listed are appended after in their natural order.

```typescript
export const VARIANT_SORT_ORDER: string[] = ['color-label', 'finish-label', 'size'];
```

---

## How availability works

An attribute option is **enabled** only when at least one variant exists that satisfies **all** of:

1. Has this attribute = the option value
2. Has `availability.isOnStock === true`
3. Has all **other currently-selected** attribute values (cross-attribute filtering)

**Example:** Color = Blue, Finish = Matte selected → Size = S is disabled if no Blue + Matte + S variant is in stock, even if S is in stock for Blue + Gloss.

Unavailable options render as a non-clickable `<span>` (dimmed, `cursor-not-allowed`).

The current variant's `isOnStock` also drives the PDP-level out-of-stock state:
- "Out of stock" label shown above the button
- Add to cart button replaced with disabled "Currently unavailable" button
- Translations: `product.outOfStock` / `product.currentlyUnavailable` in `site/messages/*.json`

---

## Attribute display labels

Labels shown above each selector group (e.g. "Color", "Größe") are fetched from the CT product type model via `getAttributeLabels(locale)` in `lib/ct/facets.ts` (reuses the cached product type fetch). `deriveDisplayLabel()` in `page.tsx` is used as a fallback when the attribute is not found in the product type.

---

## `PDP_INFO_ATTRIBUTES`

Attribute names to render as informational text sections on the PDP, below the product description. Each entry renders with its localized label from the CT product type model and its value as preformatted text (preserves line breaks).

```typescript
export const PDP_INFO_ATTRIBUTES: string[] = ['productspec', 'product-spec'];
```

- Labels come from the CT product type model (same cached fetch as variant selectors); `deriveDisplayLabel()` is the fallback.
- Values are rendered in a `<pre>` block with `whitespace-pre-wrap`.
- Attributes with no value on the current variant are silently skipped.
- **To add an info section:** append the CT attribute name.
- **To remove one:** delete it from the array.
- Note: attributes in `PDP_INFO_ATTRIBUTES` should typically also be in `VARIANT_SELECTOR_BLOCKLIST` so they don't appear as selectors.

---

## Adding a new selectable attribute

1. Make sure its CT attribute name is **not** in `VARIANT_SELECTOR_BLOCKLIST`.
2. If it should render as a color swatch, add it to `VARIANT_RENDERER_MAP` and `VARIANT_COLOR_CODE_ATTR`.
3. Add it to `VARIANT_SORT_ORDER` at the desired position (optional — it will appear last otherwise).
4. Ensure the CT product type has `isSearchable: false` or `true` — availability is not affected by searchability.

## Hiding an existing attribute

Add its name to `VARIANT_SELECTOR_BLOCKLIST`.