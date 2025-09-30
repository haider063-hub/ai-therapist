import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.pg";

// Force load environment variables
import "load-env";

// Function to get connection string
function getConnectionString(): string {
  // Check primary environment variable names (in order of preference)
  const possibleUrls = [process.env.POSTGRES_URL, process.env.DATABASE_URL];

  const validUrl = possibleUrls.find(
    (url) => url && url.startsWith("postgresql://"),
  );

  if (validUrl) {
    return validUrl;
  }

  console.error("No valid database URL found in environment variables!");

  // Fallback to localhost (this should NOT happen in production)
  const fallbackUrl =
    "postgres://postgres:db_password@localhost:5434/echonest_ai_therapy_db";
  console.warn(
    "Using fallback localhost connection - this will fail in production!",
  );
  return fallbackUrl;
}

const connectionString = getConnectionString();

const pool = new Pool({
  connectionString,
});

// Add error handling for connection issues
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export const pgDb = drizzle(pool, { schema });
