-- Stable cart-line slots. Backfill from createdAt so existing carts keep
-- their current order; new rows take max(position)+1; deletes leave gaps
-- so Undo can reclaim the original slot.
ALTER TABLE "cart_items" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

UPDATE "cart_items" AS ci
SET "position" = sub.rn - 1
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "cartId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "cart_items"
) AS sub
WHERE ci.id = sub.id;

CREATE UNIQUE INDEX "cart_items_cartId_position_key" ON "cart_items"("cartId", "position");
