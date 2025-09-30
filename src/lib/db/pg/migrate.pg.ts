import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pgDb } from "./db.pg";

export async function runMigrate() {
  console.log("Running database migrations...");
  await migrate(pgDb, { migrationsFolder: "./src/lib/db/migrations/pg" });
  console.log("Migrations completed successfully");
}
