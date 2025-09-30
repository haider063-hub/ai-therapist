import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.pg";

// Force load environment variables
import "load-env";

// Debug: Log environment variable status
console.log("Environment check:");
console.log("- NODE_ENV:", process.env.NODE_ENV);
console.log("- POSTGRES_URL exists:", !!process.env.POSTGRES_URL);
console.log("- POSTGRES_URL length:", process.env.POSTGRES_URL?.length || 0);
console.log(
  "- POSTGRES_URL starts with:",
  process.env.POSTGRES_URL?.substring(0, 20) || "undefined",
);

const connectionString =
  process.env.POSTGRES_URL ||
  "postgres://postgres:db_password@localhost:5434/echonest_ai_therapy_db";

// Debug: Log the connection string (without sensitive data)
console.log(
  "Database connection string:",
  connectionString.replace(/\/\/.*@/, "//***:***@"),
);

const pool = new Pool({
  connectionString,
});

// Add error handling for connection issues
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

pool.on("connect", () => {
  console.log("Database connection established");
});

export const pgDb = drizzle(pool, { schema });
