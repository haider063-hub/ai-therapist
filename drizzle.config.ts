import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/pg/schema.pg.ts",
  out: "./src/lib/db/migrations/pg",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.POSTGRES_URL ||
      "postgres://postgres:db_password@localhost:5434/echonest_ai_therapy_db",
  },
});
