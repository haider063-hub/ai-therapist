import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pgDb } from "./db.pg";

export async function runMigrate() {
  try {
    await migrate(pgDb, { migrationsFolder: "./src/lib/db/migrations/pg" });
  } catch (error: any) {
    // If tables already exist, that's not necessarily an error
    if (error.message && error.message.includes("already exists")) {
      return; // Don't throw, just continue silently
    }
    // For other errors, re-throw
    throw error;
  }
}
