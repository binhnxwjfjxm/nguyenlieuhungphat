import type { Product } from "./contracts";

export interface ProductSeriesGroup {
  key: string;
  name: string;
  prefixTokenCount: number;
  sourceSeries: string;
  products: Product[];
}

export interface ProductSeriesIndex {
  groups: ProductSeriesGroup[];
  groupsByKey: Map<string, ProductSeriesGroup>;
  groupKeyBySku: Map<string, string>;
  groupKeyByFamilySku: Map<string, string>;
}

export declare function normalizeSeriesText(value: unknown): string;
export declare function buildProductSeriesIndex(products: Product[]): ProductSeriesIndex;
export declare function productSeriesVariantLabel(product: Product, group: ProductSeriesGroup | null | undefined): string;
