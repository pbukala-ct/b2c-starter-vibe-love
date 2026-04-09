/**
 * Attribute names to never render as variant selectors on the PDP.
 * Add any attribute here to prevent it from appearing as a selection option.
 */
export const VARIANT_SELECTOR_BLOCKLIST: string[] = [
  'new-arrival',
  'subscription-eligible',
  'productspec',
  'product-spec',
  'aiEnrichedDescription',
  // Raw code attrs — exposed via swatch rendering of the paired display attr
  'color-code',
  'finish-code',
  // Machine-readable search attrs — use the human-readable display attrs instead
  'search-color',
  'search-finish',
  'type',
];

export type VariantRenderer = 'pill' | 'color';

/**
 * Maps attribute name → render style.
 * Attributes not listed here default to 'pill'.
 */
export const VARIANT_RENDERER_MAP: Record<string, VariantRenderer> = {
  'color-label': 'color',
  'finish-label': 'color',
};

/**
 * Attribute names to render as informational text sections on the PDP,
 * below the product description. Each entry is rendered with its localized
 * label from the CT product type model and its value as preformatted text.
 * Add or remove attribute names here to control which fields appear.
 */
export const PDP_INFO_ATTRIBUTES: string[] = ['productspec', 'product-spec'];

/**
 * Display order for variant selector groups.
 * Attributes listed here appear first in the given order.
 * Unlisted attributes are appended after in their natural order.
 */
export const VARIANT_SORT_ORDER: string[] = ['color-label', 'finish-label', 'size'];

/**
 * For color-swatch attributes, maps the display attribute name to the
 * companion attribute holding the hex color code.
 * The label value is used as the swatch text and hover tooltip;
 * the code value is used as the swatch background color.
 */
export const VARIANT_COLOR_CODE_ATTR: Record<string, string> = {
  'color-label': 'color-code',
  'finish-label': 'finish-code',
};
