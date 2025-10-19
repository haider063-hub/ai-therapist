"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "lib/utils";
import { useTranslations } from "next-intl";
import { SocialAuthenticationProvider } from "app-types/authentication";
import SocialProviders from "./social-providers";
import { Mail } from "lucide-react";
import { authClient } from "auth/client";
import { toast } from "sonner";
import { startTransition } from "react";

export default function SignUpPage({
  emailAndPasswordEnabled,
  socialAuthenticationProviders,
  isFirstUser,
}: {
  emailAndPasswordEnabled: boolean;
  socialAuthenticationProviders: SocialAuthenticationProvider[];
  isFirstUser: boolean;
}) {
  const t = useTranslations();
  const handleSocialSignIn = (provider: SocialAuthenticationProvider) => {
    startTransition(async () => {
      try {
        await authClient.signIn.social({
          provider,
          callbackURL: "/api/auth/callback-handler",
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };
  return (
    <div className="w-full h-full flex flex-col sm:p-4 md:p-8 justify-center">
      {/* EchoNest AI Therapy Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          EchoNest AI Therapy
        </h1>
        <p className="text-white/80 text-sm">Your compassionate AI therapist</p>
      </div>

      <Card className="w-full md:max-w-md bg-white border-none mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-black">
            {isFirstUser ? t("Auth.SignUp.titleAdmin") : t("Auth.SignUp.title")}
          </CardTitle>
          <CardDescription className="text-center text-black">
            {isFirstUser
              ? t("Auth.SignUp.signUpDescriptionAdmin")
              : t("Auth.SignUp.signUpDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {emailAndPasswordEnabled && (
            <Link
              href="/sign-up/email"
              data-testid="email-signup-button"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full bg-black hover:bg-gray-800 text-white px-4 sm:px-0",
              )}
              style={{ backgroundColor: "black", color: "white" }}
            >
              <Mail className="size-4" />
              {t("Auth.SignUp.email")}
            </Link>
          )}
          {socialAuthenticationProviders.length > 0 && (
            <>
              {emailAndPasswordEnabled && (
                <div className="flex items-center my-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500 lowercase">
                    or
                  </span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
              )}
              <SocialProviders
                socialAuthenticationProviders={socialAuthenticationProviders}
                onSocialProviderClick={handleSocialSignIn}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
