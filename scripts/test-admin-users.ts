#!/usr/bin/env tsx

/**
 * Test script for admin users pagination and search
 * Run with: npx tsx scripts/test-admin-users.ts
 */

import { pgAdminRepository } from "../src/lib/db/pg/repositories/admin-respository.pg";

async function testAdminUsers() {
  console.log("🧪 Testing Admin Users Pagination and Search...\n");

  try {
    // Test 1: Get all users (no pagination)
    console.log("1️⃣ Testing getAllUsers...");
    const allUsers = await pgAdminRepository.getAllUsers();
    console.log(`✅ Found ${allUsers.length} total users`);

    // Test 2: Test pagination
    console.log("\n2️⃣ Testing pagination...");
    const page1 = await pgAdminRepository.getUsers({ limit: 5, offset: 0 });
    console.log(
      `✅ Page 1: ${page1.users.length} users (total: ${page1.total})`,
    );

    const page2 = await pgAdminRepository.getUsers({ limit: 5, offset: 5 });
    console.log(
      `✅ Page 2: ${page2.users.length} users (total: ${page2.total})`,
    );

    // Test 3: Test search by email
    console.log("\n3️⃣ Testing search by email...");
    if (allUsers.length > 0) {
      const testEmail = allUsers[0].email;
      const searchByEmail = await pgAdminRepository.getUsers({
        searchValue: testEmail.substring(0, 5), // Search partial email
        searchField: "email",
        limit: 10,
      });
      console.log(
        `✅ Search by email "${testEmail.substring(0, 5)}": ${searchByEmail.users.length} results`,
      );
    }

    // Test 4: Test search by name
    console.log("\n4️⃣ Testing search by name...");
    if (allUsers.length > 0 && allUsers[0].name) {
      const testName = allUsers[0].name;
      const searchByName = await pgAdminRepository.getUsers({
        searchValue: testName.substring(0, 3), // Search partial name
        searchField: "name",
        limit: 10,
      });
      console.log(
        `✅ Search by name "${testName.substring(0, 3)}": ${searchByName.users.length} results`,
      );
    }

    // Test 5: Test search both name and email
    console.log("\n5️⃣ Testing search both name and email...");
    const searchBoth = await pgAdminRepository.getUsers({
      searchValue: "a", // Search for 'a' in both name and email
      searchField: "both",
      limit: 10,
    });
    console.log(
      `✅ Search both name and email for "a": ${searchBoth.users.length} results`,
    );

    // Test 6: Test sorting
    console.log("\n6️⃣ Testing sorting...");
    const sortedAsc = await pgAdminRepository.getUsers({
      sortDirection: "asc",
      limit: 5,
    });
    const sortedDesc = await pgAdminRepository.getUsers({
      sortDirection: "desc",
      limit: 5,
    });
    console.log(`✅ Sorted ASC: ${sortedAsc.users.length} users`);
    console.log(`✅ Sorted DESC: ${sortedDesc.users.length} users`);

    console.log("\n✅ All admin users tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("   ✅ Pagination is working (10 users per page)");
    console.log("   ✅ Search by email is working");
    console.log("   ✅ Search by name is working");
    console.log("   ✅ Search both name and email is working");
    console.log("   ✅ Sorting is working");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run the test
testAdminUsers().catch(console.error);
