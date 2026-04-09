---
name: image-config
description: How to configure product image URL transformations for listing pages, PDP carousel, and PDP thumbnails — CDN prefixes, resize suffixes, format conversion, and per-context transforms.
---

# Image URL Configuration

All product image URL transformations are controlled by a single config file:

```
site/lib/ct/image-config.ts
```

No component changes are needed for common adjustments — edit the config only.

---

## Three transform functions

| Function | Used by | Context |
|---|---|---|
| `transformListingImageUrl` | `ProductCard` | Category pages, search results, product grids |
| `transformDetailImageUrl` | `ProductImageCarousel` (main slides) | PDP carousel large images |
| `transformThumbnailImageUrl` | `ProductImageCarousel` (thumbnail strip) | PDP small gallery images |

Each function receives the raw CT image URL and must return the URL to pass to `<Image src={...}>`.

---

## Next.js image optimization

`next.config.ts` sets `images: { unoptimized: true }`. This means Next.js does **not** append `?w=…&q=…` parameters — images are served exactly as returned by the transform functions. This is intentional: CT images come from a CDN that already serves them; letting Next.js re-optimize would append query params that GCS rejects.

**Do not remove `unoptimized: true`** unless you are proxying images through a CDN that accepts Next.js image optimization parameters.

---

## Common patterns

### Suffix-based CDN variants (current setup)

Insert a size suffix before the file extension:

```typescript
export function transformListingImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-medium$1$2');
}

export function transformDetailImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-large$1$2');
}

export function transformThumbnailImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-small$1$2');
}
```

`tray.jpeg` → `tray-medium.jpeg` / `tray-large.jpeg` / `tray-small.jpeg`

The regex matches the last `.ext` before end-of-string or a `?` query string, so URLs with existing query parameters are handled correctly.

---

### Replace origin with CDN hostname

```typescript
export function transformListingImageUrl(url: string): string {
  return url.replace('https://storage.googleapis.com', 'https://cdn.example.com');
}
```

---

### Imgix

```typescript
export function transformListingImageUrl(url: string): string {
  return `https://your-project.imgix.net/${encodeURIComponent(url)}?w=600&auto=format&q=75`;
}

export function transformDetailImageUrl(url: string): string {
  return `https://your-project.imgix.net/${encodeURIComponent(url)}?w=1200&auto=format&q=85`;
}

export function transformThumbnailImageUrl(url: string): string {
  return `https://your-project.imgix.net/${encodeURIComponent(url)}?w=120&auto=format&q=60`;
}
```

---

### Cloudinary

```typescript
export function transformListingImageUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_600,f_auto,q_auto/');
}

export function transformDetailImageUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_1200,f_auto,q_auto/');
}

export function transformThumbnailImageUrl(url: string): string {
  return url.replace('/upload/', '/upload/w_120,f_auto,q_auto/');
}
```

---

### Identity (no transformation)

```typescript
export function transformListingImageUrl(url: string): string {
  return url;
}
```

---

## Adding a new image context

If a new component needs its own transform (e.g. cart line items, wishlist):

1. Export a new function from `image-config.ts`, e.g. `transformCartImageUrl`.
2. Import and call it in the component where the `<Image src={...}>` is rendered.
3. Document it in the table above.
