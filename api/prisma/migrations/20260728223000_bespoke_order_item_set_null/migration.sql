-- Allow deleting saved formulas after purchase; order lines keep formulaJson snapshot.
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_bespokePerfumeId_fkey";

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bespokePerfumeId_fkey" FOREIGN KEY ("bespokePerfumeId") REFERENCES "bespoke_perfumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
