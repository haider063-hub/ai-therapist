import SignIn from "@/components/auth/sign-in";
import { getAuthConfig } from "lib/auth/config";
import { getIsFirstUser } from "lib/auth/server";

export default async function SignInPage() {
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
    signUpEnabled,
    socialAuthenticationProviders,
  } = getAuthConfig();
  const enabledProviders = (
    Object.keys(
      socialAuthenticationProviders,
    ) as (keyof typeof socialAuthenticationProviders)[]
  ).filter((key) => socialAuthenticationProviders[key]);
  return (
    <SignIn
      emailAndPasswordEnabled={emailAndPasswordEnabled}
      signUpEnabled={signUpEnabled}
      socialAuthenticationProviders={enabledProviders}
      isFirstUser={isFirstUser}
    />
  );
}
