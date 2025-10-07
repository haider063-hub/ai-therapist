import { Think } from "ui/think";
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

            {/* Top Section: Key Features */}
            <div className="space-y-6 animate-in fade-in duration-1000">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Why Choose EchoNest?
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    AI-Powered Compassionate Therapy
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    24/7 Available Support
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Multilingual AI Therapists
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Personalized Treatment Plans
                  </span>
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
