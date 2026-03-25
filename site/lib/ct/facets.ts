import { apiRoot } from './client';
import { getLocalizedString } from '@/lib/utils';
import type {
  AttributeDefinition,
  AttributeEnumType,
  AttributeLocalizedEnumType,
  AttributeSetType,
  ProductSearchFacetDistinctValue,
  ProductSearchFacetExpression,
  ProductSearchFacetRangesValue,
  ProductType,
} from '@commercetools/platform-sdk';

export interface FacetDefinition {
  attributeType?: string;
  attributeId?: string;
  attributeLabel?: string;
  attributeValues?: { key: string; label: string }[];
}

function isEnumType(
  type: AttributeDefinition['type']
): type is AttributeEnumType | AttributeLocalizedEnumType {
  const name = 'elementType' in type ? (type as AttributeSetType).elementType.name : type.name;
  return name === 'enum' || name === 'lenum';
}

let _productTypesCache: { data: ProductType[]; expiry: number } | null = null;

async function fetchProductTypes(): Promise<ProductType[]> {
  if (_productTypesCache && Date.now() < _productTypesCache.expiry) {
    return _productTypesCache.data;
  }
  const { body } = await apiRoot
    .productTypes()
    .get({ queryArgs: { limit: 500 } })
    .execute();
  _productTypesCache = { data: body.results, expiry: Date.now() + 60_000 };
  return body.results;
}

export async function getSearchableAttributes(locale: string): Promise<FacetDefinition[]> {
  const productTypes = await fetchProductTypes();
  const seen = new Set<string>();
  return productTypes
    .flatMap((pt) => pt.attributes ?? [])
    .filter((attr) => {
      if (!attr.isSearchable || seen.has(attr.name)) return false;
      seen.add(attr.name);
      return true;
    })
    .map((attribute) => {
      const resolvedType =
        'elementType' in attribute.type
          ? (attribute.type as AttributeSetType).elementType.name
          : attribute.type.name;

      const enumValues =
        isEnumType(attribute.type) &&
        (attribute.type as AttributeEnumType | AttributeLocalizedEnumType)?.values?.length > 0
          ? (attribute.type as AttributeEnumType | AttributeLocalizedEnumType)?.values?.map(
              (value) => ({
                key: value.key,
                label:
                  typeof value.label === 'string'
                    ? value.label
                    : getLocalizedString(value.label as Record<string, string>, locale) ||
                      value.key,
              })
            )
          : undefined;

      return {
        attributeType: resolvedType,
        attributeId: `variants.attributes.${attribute.name}`,
        attributeLabel:
          getLocalizedString(attribute.label as Record<string, string>, locale) || attribute.name,
        attributeValues: enumValues,
      };
    });
}

export function facetDefinitionToFacetValue(
  facetDefinition: FacetDefinition,
  locale: string
):
  | Pick<ProductSearchFacetDistinctValue, 'name' | 'field' | 'fieldType' | 'language'>
  | Pick<ProductSearchFacetRangesValue, 'name' | 'field' | 'fieldType'> {
  switch (facetDefinition.attributeType) {
    case 'money':
      return {
        name: facetDefinition.attributeId!,
        field: `${facetDefinition.attributeId}.centAmount`,
      };
    case 'enum':
      return {
        name: facetDefinition.attributeId!,
        field: `${facetDefinition.attributeId}.key`,
        fieldType: 'enum',
      };
    case 'lenum':
      return {
        name: facetDefinition.attributeId!,
        field: `${facetDefinition.attributeId}.key`,
        fieldType: 'lenum',
        language: locale,
      };
    case 'ltext':
      return {
        name: facetDefinition.attributeId!,
        field: facetDefinition.attributeId!,
        fieldType: 'ltext',
        language: locale,
      };
    case 'text':
    case 'number':
    case 'boolean':
      return {
        name: facetDefinition.attributeId!,
        field: facetDefinition.attributeId!,
        fieldType: facetDefinition.attributeType,
      };
    case 'reference':
      return {
        name: facetDefinition.attributeId!,
        field: `${facetDefinition.attributeId}.id`,
        fieldType: 'reference',
      };
    default:
      return { name: facetDefinition.attributeId!, field: facetDefinition.attributeId! };
  }
}

export function facetDefinitionsToFacetExpressions(
  facetDefinitions: FacetDefinition[],
  locale: string
): ProductSearchFacetExpression[] {
  return facetDefinitions.map((facetDefinition) => {
    const facetValue = facetDefinitionToFacetValue(facetDefinition, locale);
    switch (facetDefinition.attributeType) {
      case 'enum':
      case 'lenum':
      case 'ltext':
      case 'boolean':
      case 'text':
      case 'number':
      case 'reference':
        return {
          distinct: {
            ...facetValue,
            level: 'products',
            sort: { by: 'key', order: 'asc' },
          },
        } as ProductSearchFacetExpression;
      case 'money':
      case 'range':
        return {
          ranges: {
            ...facetValue,
            level: 'products',
            ranges: [{ from: 0 }],
          },
        } as ProductSearchFacetExpression;
      default:
        return {
          count: {
            ...facetValue,
            level: 'products',
            scope: 'all',
          },
        } as ProductSearchFacetExpression;
    }
  });
}
