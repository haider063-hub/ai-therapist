import SignUpPage from "@/components/auth/sign-up";
import { getAuthConfig } from "auth/config";
import { getIsFirstUser } from "lib/auth/server";
import { redirect } from "next/navigation";

// Force dynamic rendering to avoid build-time database calls
export const dynamic = "force-dynamic";

export default async function SignUp() {
  // Handle database connection gracefully during build
  let isFirstUser = false;
  try {
    isFirstUser = await getIsFirstUser();
  } catch (_error) {
    console.log("Could not check first user during build, defaulting to false");
    isFirstUser = false;
  }

  const {
    emailAndPasswordEnabled,
    socialAuthenticationProviders,
    signUpEnabled,
  } = getAuthConfig();

  if (!signUpEnabled) {
    redirect("/sign-in");
  }
  const enabledProviders = (
    Object.keys(
      socialAuthenticationProviders,
    ) as (keyof typeof socialAuthenticationProviders)[]
  ).filter((key) => socialAuthenticationProviders[key]);
  return (
    <SignUpPage
      isFirstUser={isFirstUser}
      emailAndPasswordEnabled={emailAndPasswordEnabled}
      socialAuthenticationProviders={enabledProviders}
    />
  );
}
