import { pgDb } from "./src/lib/db/pg/db.pg";
import { sql } from "drizzle-orm";

async function removeContentColumn() {
  try {
    console.log("Checking if content column exists...");

    // Check if content column exists
    const result = await pgDb.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chat_message' 
      AND column_name = 'content'
    `);

    if (result.rows.length > 0) {
      console.log("Content column exists, dropping it...");

      // Drop the content column
      await pgDb.execute(sql`ALTER TABLE chat_message DROP COLUMN content`);

      console.log("Successfully dropped content column");
    } else {
      console.log("Content column does not exist");
    }

    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

removeContentColumn();
