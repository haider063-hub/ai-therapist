import { pgDb } from "../src/lib/db/pg/db.pg";
import {
  UserSchema,
  SessionSchema,
  AccountSchema,
  VerificationSchema,
} from "../src/lib/db/pg/schema.pg";

async function deleteAllUsers() {
  console.log("🗑️ Starting to delete all users and related data...");

  try {
    // Delete in the correct order to respect foreign key constraints
    console.log("1. Deleting sessions...");
    await pgDb.delete(SessionSchema);
    console.log("✅ Sessions deleted");

    console.log("2. Deleting accounts...");
    await pgDb.delete(AccountSchema);
    console.log("✅ Accounts deleted");

    console.log("3. Deleting verifications...");
    await pgDb.delete(VerificationSchema);
    console.log("✅ Verifications deleted");

    console.log("4. Deleting users...");
    await pgDb.delete(UserSchema);
    console.log("✅ Users deleted");

    console.log(
      "🎉 All users and related data have been successfully deleted!",
    );
    console.log("You can now create a new admin account by signing up.");
  } catch (error) {
    console.error("❌ Error deleting users:", error);
    throw error;
  }
}

// Run the deletion
deleteAllUsers()
  .then(() => {
    console.log("✅ Database cleanup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Database cleanup failed:", error);
    process.exit(1);
  });
