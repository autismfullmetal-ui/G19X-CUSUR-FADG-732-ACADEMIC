import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("prisma/dev.db");
try {
  db.exec('ALTER TABLE "Recommendation" ADD COLUMN "activities" TEXT');
  console.log("columna activities agregada");
} catch (e) {
  console.log("sin cambios:", e.message);
}
