-- Generaliza la trazabilidad de origen de los valores nutricionales:
-- de offId (solo Open Food Facts) a sourceId + sourceRef (cualquier fuente).

-- AddColumn
ALTER TABLE "Ingredient" ADD COLUMN "sourceId" TEXT;
ALTER TABLE "Ingredient" ADD COLUMN "sourceRef" TEXT;

-- Preserva los datos existentes: lo que estaba en offId venía de Open Food Facts.
UPDATE "Ingredient"
SET "sourceId" = 'off', "sourceRef" = "offId"
WHERE "offId" IS NOT NULL;

-- DropColumn
ALTER TABLE "Ingredient" DROP COLUMN "offId";
