import { getTranslations } from "next-intl/server";
import { FlipWords } from "ui/flip-words";
import { BackgroundPaths } from "ui/background-paths";
import { Heart, Shield, Clock, Globe, Users, CheckCircle } from "lucide-react";

export default async function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  const t = await getTranslations("Auth.Intro");
  return (
    <main className="relative w-full flex flex-col h-screen">
      {/* Background */}
      <div className="echonest-gradient-bg"></div>
      <div className="flex-1 relative z-10">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:flex lg:w-1/2 bg-muted border-r flex-col p-18 relative">
            <div className="absolute inset-0 w-full h-full">
              <BackgroundPaths />
            </div>

            {/* Top Section: Welcome Header */}
            <div className="space-y-6 animate-in fade-in duration-1000">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">
                  <span className="text-foreground">Welcome to </span>
                  <span className="gradient-text">EchoNest</span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Your AI-powered therapy companion. Find support, guidance, and
                  healing through personalized conversations designed to help
                  you thrive.
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    24/7 Support
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Always here when you need us
                  </p>
                </div>
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-white/20">
                  <h3 className="font-semibold text-foreground mb-2">
                    Private & Secure
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your conversations stay confidential
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: Trust Indicators */}
            <div className="flex-1 flex items-center">
              <div className="space-y-4 animate-in fade-in duration-1000 delay-300">
                <h3 className="text-lg font-semibold text-foreground">
                  Trusted & Secure
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      HIPAA Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      End-to-End Encryption
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">
                      Privacy Protected
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: FlipWords Description */}
            <FlipWords
              words={[t("description")]}
              className="mb-4 text-muted-foreground animate-in fade-in duration-1000 delay-500"
            />
          </div>

          <div className="w-full lg:w-1/2 p-0 sm:p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
