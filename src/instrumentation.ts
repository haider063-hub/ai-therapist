import { IS_VERCEL_ENV } from "lib/const";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (!IS_VERCEL_ENV && process.env.POSTGRES_URL) {
      // Auto-run migrations on startup
      const runMigrate = await import("./lib/db/pg/migrate.pg").then(
        (m) => m.runMigrate,
      );
      await runMigrate().catch((e) => {
        // If tables already exist, that's okay - just continue silently
        if (!e.message || !e.message.includes("already exists")) {
          console.error("❌ Migration failed:", e);
          process.exit(1);
        }
      });
    }
  }
}
