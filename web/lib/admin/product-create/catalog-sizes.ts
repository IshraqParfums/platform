/**
 * Standard catalog bottle sizes on the create form.
 * Odd sizes stay available via edit → Add variant.
 */
export const CATALOG_SIZE_OPTIONS_ML = [30, 50, 100] as const;

export type CatalogSizeMl = (typeof CATALOG_SIZE_OPTIONS_ML)[number];
