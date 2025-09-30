import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pgDb } from "./db.pg";

export async function runMigrate() {
  console.log("Running database migrations...");
  try {
    await migrate(pgDb, { migrationsFolder: "./src/lib/db/migrations/pg" });
    console.log("✅ Migrations completed successfully");
  } catch (error: any) {
    // If tables already exist, that's not necessarily an error
    if (error.message && error.message.includes("already exists")) {
      console.log(
        "ℹ️ Some tables already exist - this is normal if the database was previously initialized",
      );
      return; // Don't throw, just continue
    }
    // For other errors, re-throw
    throw error;
  }
}
