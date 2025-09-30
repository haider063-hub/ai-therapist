import EmailSignUp from "@/components/auth/email-sign-up";
import { getIsFirstUser } from "lib/auth/server";

// Force dynamic rendering to avoid build-time database calls
export const dynamic = "force-dynamic";

export default async function EmailSignUpPage() {
  // Handle database connection gracefully during build
  let isFirstUser = false;
  try {
    isFirstUser = await getIsFirstUser();
  } catch (_error) {
    console.log("Could not check first user during build, defaulting to false");
    isFirstUser = false;
  }

  return <EmailSignUp isFirstUser={isFirstUser} />;
}
