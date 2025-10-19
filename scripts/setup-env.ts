#!/usr/bin/env tsx

/**
 * Environment setup helper script
 * Run with: npx tsx scripts/setup-env.ts
 */

import { writeFileSync, existsSync } from "fs";
import { join } from "path";

function createEnvTemplate() {
  const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/echonest_db

# Authentication Configuration
BETTER_AUTH_SECRET=your_secret_key_here_minimum_32_characters
BETTER_AUTH_URL=http://localhost:3000

# Email Service (Required for OTP)
RESEND_API_KEY=your_resend_api_key_here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_FORCE_ACCOUNT_SELECTION=true

# Apple OAuth (Optional)
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

# Microsoft OAuth (Optional)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=common

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Other Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
`;

  const envPath = join(process.cwd(), ".env.local");

  if (existsSync(envPath)) {
    console.log(
      "⚠️  .env.local already exists. Creating .env.local.example instead.",
    );
    writeFileSync(join(process.cwd(), ".env.local.example"), envTemplate);
    console.log("✅ Created .env.local.example");
  } else {
    writeFileSync(envPath, envTemplate);
    console.log("✅ Created .env.local");
  }
}

function displaySetupInstructions() {
  console.log("\n🔧 Environment Setup Instructions:");
  console.log(
    "1. Update the values in .env.local with your actual credentials",
  );
  console.log("2. Get Resend API key from https://resend.com/");
  console.log("3. Set up OAuth providers (optional but recommended):");
  console.log("   - Google: https://console.cloud.google.com/");
  console.log("   - Apple: https://developer.apple.com/");
  console.log("   - Microsoft: https://portal.azure.com/");
  console.log("   - GitHub: https://github.com/settings/developers");
  console.log(
    "4. Run database migration: psql -d your_db -f scripts/create-otp-table.sql",
  );
  console.log("5. Start the development server: npm run dev");
  console.log(
    "6. Test the authentication flow at http://localhost:3000/sign-up",
  );
}

function main() {
  console.log("🚀 Setting up environment configuration...\n");

  createEnvTemplate();
  displaySetupInstructions();

  console.log("\n📚 For detailed setup instructions, see:");
  console.log("- AUTHENTICATION_SETUP.md");
  console.log("- DEPLOYMENT_CHECKLIST.md");
}

main();
