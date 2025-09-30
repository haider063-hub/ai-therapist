import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.pg";

const connectionString =
  process.env.POSTGRES_URL ||
  "postgres://postgres:db_password@localhost:5434/echonest_ai_therapy_db";

const pool = new Pool({
  connectionString,
});

export const pgDb = drizzle(pool, { schema });
