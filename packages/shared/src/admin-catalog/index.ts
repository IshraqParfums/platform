export type {
  AdjustStockBody,
  AdminLowStockVariant,
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductVariant,
  CreateProductBody,
  CreateVariantBody,
  ProductArchiveReason,
  ProductStatus,
  UpdateImageBody,
  UpdateProductBody,
  UpdateVariantBody,
} from "./admin-product-contracts.js";
export {
  ADMIN_PRODUCT_STATUS_TRANSITIONS,
  isValidAdminProductStatusTransition,
  legalNextAdminProductStatuses,
} from "./product-status-transitions.js";
export type {
  AdminCollectionResponse,
  ArchiveCollectionResponse,
  CollectionStatus,
  CreateCollectionBody,
  RestoreCollectionResponse,
  UpdateCollectionBody,
} from "./admin-collection-contracts.js";
