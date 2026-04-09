/**
 * Image URL configuration for product images.
 *
 * Edit the two functions below to apply CDN prefixes, resize parameters,
 * format conversions, or any other URL transformations.
 *
 * Examples:
 *
 *   // Add Imgix resize parameters
 *   return `https://your-imgix-domain.imgix.net/${encodeURIComponent(url)}?w=400&auto=format`;
 *
 *   // Replace the GCS origin with a CDN edge hostname
 *   return url.replace('https://storage.googleapis.com', 'https://cdn.example.com');
 *
 *   // Append Cloudinary transformation
 *   return url.replace('/upload/', '/upload/w_400,f_auto,q_auto/');
 */

/**
 * Transform a product image URL for listing pages
 * (category pages, search results, product cards).
 */
export function transformListingImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-medium$1$2');
}

/**
 * Transform a product image URL for the product detail page (PDP carousel).
 */
export function transformDetailImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-large$1$2');
}

/**
 * Transform a product image URL for the PDP thumbnail strip (small gallery images).
 */
export function transformThumbnailImageUrl(url: string): string {
  return url.replace(/(\.[^./?#]+)($|\?)/, '-small$1$2');
}
