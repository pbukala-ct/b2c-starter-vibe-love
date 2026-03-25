import type { FacetDefinition } from './facets';

/**
 * Attribute IDs to exclude from the auto-fetched facet definitions.
 * Add attribute IDs here to prevent them from appearing as facets.
 * Format: 'variants.attributes.<attribute-name>'
 */
export const FACET_BLOCKLIST: string[] = [
  // e.g. 'variants.attributes.internal-flag',
  'variants.attributes.type',
  'variants.attributes.aiEnrichedDescription',
  'variants.attributes.color-code',
  'variants.attributes.color-label',
  'variants.attributes.finish-code',
  'variants.attributes.finish-label',
];

/**
 * Additional facet definitions appended after filtering.
 * Use this for facets that are not product type attributes (e.g. price ranges).
 * @param t — translation function for the 'search' namespace
 */
export function getExtraFacets(t: (key: string) => string): FacetDefinition[] {
  return [
    {
      attributeId: 'variants.prices',
      attributeType: 'money',
      attributeLabel: t('price'),
    },
  ];
}

/**
 * How to render a facet in the filter sidebar.
 * - 'color' — color swatches (maps bucket keys to hex values)
 * - 'pill'  — pill buttons with counts (default for unknown facets)
 */
export type FacetRenderer = 'color' | 'pill';

export interface FacetRenderConfig {
  renderer: FacetRenderer;
  /**
   * URL query param key to use for this facet.
   * Defaults to the attribute name (strips 'variants.attributes.' prefix).
   */
  urlParam?: string;
}

/**
 * Maps facet attributeId → render config.
 * Facets not listed here are rendered as 'pill' using the auto-derived URL param.
 */
export const FACET_RENDERER_MAP: Record<string, FacetRenderConfig> = {
  'variants.attributes.search-color': { renderer: 'color', urlParam: 'color' },
  'variants.attributes.search-finish': { renderer: 'color', urlParam: 'finish' },
};
