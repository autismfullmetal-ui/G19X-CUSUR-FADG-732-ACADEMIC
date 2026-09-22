import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";

const db = new DatabaseSync("prisma/dev.db");
db.exec(fs.readFileSync("prisma/init.sql", "utf8"));
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all();
console.log("Tablas creadas:", tables.map((t) => t.name).join(", "));
