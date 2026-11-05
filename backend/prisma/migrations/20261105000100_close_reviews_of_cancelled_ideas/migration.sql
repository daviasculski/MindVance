-- CAN-02: ideias canceladas antes desta correção podem ter ficado com rodadas abertas
-- (e por isso continuavam nas filas). Encerra essas rodadas.
UPDATE "gate_reviews" SET "status" = 'CANCELADA'
WHERE "status" IN ('AGUARDANDO_DESIGNACAO', 'EM_AVALIACAO', 'AGUARDANDO_DECISAO')
  AND "ideaId" IN (SELECT "id" FROM "ideas" WHERE "status" = 'CANCELLED');
