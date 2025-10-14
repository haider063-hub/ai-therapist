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
  // Enhanced connection settings for better reliability
  max: 15, // Reduced pool size to prevent connection exhaustion
  min: 2, // Keep minimum connections alive
  idleTimeoutMillis: 60000, // Increased idle timeout to 60 seconds
  connectionTimeoutMillis: 15000, // Increased connection timeout to 15 seconds
  statement_timeout: 45000, // Increased query timeout to 45 seconds
  query_timeout: 45000, // Increased query timeout to 45 seconds
  // SSL settings for better connection stability
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // Additional connection options for stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  // Force UTC timezone for all connections
  options: "-c timezone=UTC",
});

// Add error handling for connection issues
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Ensure UTC timezone for each new connection
pool.on("connect", async (client) => {
  try {
    // Force UTC timezone with multiple approaches
    await client.query("SET timezone = 'UTC'");
    await client.query("SET timezone_abbreviations = 'Default'");
    await client.query("SET datestyle = 'ISO'");
  } catch (error) {
    console.error("Failed to set database timezone to UTC:", error);
  }
});

export const pgDb = drizzle(pool, { schema });

// Connection health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (_error) {
    return false;
  }
}

// Enhanced database operation with connection check
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check connection health before attempting operation
      const isHealthy = await checkDatabaseConnection();
      if (!isHealthy && attempt < maxRetries) {
        console.warn(
          `Database connection unhealthy, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a connection-related error
      const isConnectionError =
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT" ||
        error?.message?.includes("Connection terminated") ||
        error?.message?.includes("connection timeout");

      if (isConnectionError && attempt < maxRetries) {
        const retryDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `Database connection error (${error?.code || "unknown"}), retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (attempt < maxRetries) {
        const retryDelay = delay * attempt;
        console.warn(
          `Database operation failed, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  console.error(
    `Database operation failed after ${maxRetries} attempts:`,
    lastError,
  );
  throw lastError;
}
