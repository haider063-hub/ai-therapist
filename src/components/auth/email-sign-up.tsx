"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useObjectState } from "@/hooks/use-object-state";
import { cn } from "lib/utils";
import { ChevronLeft, Loader } from "lucide-react";
import { toast } from "sonner";
import { safe } from "ts-safe";
import { UserZodSchema } from "app-types/user";
import { existsByEmailAction, signUpAction } from "@/app/api/auth/actions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function EmailSignUp({
  isFirstUser,
}: {
  isFirstUser: boolean;
}) {
  const t = useTranslations();
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useObjectState({
    email: "",
    name: "",
    password: "",
  });

  const steps = [
    t("Auth.SignUp.step1"),
    t("Auth.SignUp.step2"),
    t("Auth.SignUp.step3"),
  ];

  const safeProcessWithLoading = function <T>(fn: () => Promise<T>) {
    setIsLoading(true);
    return safe(() => fn()).watch(() => setIsLoading(false));
  };

  const backStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const successEmailStep = async () => {
    const { success } = UserZodSchema.shape.email.safeParse(formData.email);
    if (!success) {
      toast.error(t("Auth.SignUp.invalidEmail"));
      return;
    }
    const exists = await safeProcessWithLoading(() =>
      existsByEmailAction(formData.email),
    ).orElse(false);
    if (exists) {
      toast.error(t("Auth.SignUp.emailAlreadyExists"));
      return;
    }
    setStep(2);
  };

  const successNameStep = () => {
    const { success } = UserZodSchema.shape.name.safeParse(formData.name);
    if (!success) {
      toast.error(t("Auth.SignUp.nameRequired"));
      return;
    }
    setStep(3);
  };

  const successPasswordStep = async () => {
    // client side validation
    const { success: passwordSuccess, error: passwordError } =
      UserZodSchema.shape.password.safeParse(formData.password);
    if (!passwordSuccess) {
      const errorMessages = passwordError.issues.map((e) => e.message);
      toast.error(errorMessages.join("\n\n"));
      return;
    }

    // server side validation and admin user creation if first user
    const { success, message } = await safeProcessWithLoading(() =>
      signUpAction({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      }),
    ).unwrap();
    if (success) {
      toast.success(message);
      router.push("/profile-setup");
    } else {
      toast.error(message);
    }
  };

  return (
    <div className="w-full h-full flex flex-col px-4 sm:p-4 md:p-8 justify-center">
      {/* EchoNest AI Therapy Branding */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          EchoNest AI Therapy
        </h1>
        <p className="text-white/80 text-sm">Your compassionate AI therapist</p>
      </div>

      <Card className="w-full md:max-w-md bg-white border-none mx-auto gap-0 shadow-lg animate-in fade-in duration-1000">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-black">
            {isFirstUser ? t("Auth.SignUp.titleAdmin") : t("Auth.SignUp.title")}
          </CardTitle>
          <CardDescription className="py-12">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-black text-right">
                Step {step} of {steps.length}
              </p>
              <div className="h-2 w-full relative bg-gray-200">
                <div
                  style={{
                    width: `${(step / 3) * 100}%`,
                  }}
                  className="h-full bg-black transition-all duration-300"
                ></div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {step === 1 && (
              <div className={cn("flex flex-col gap-2")}>
                <Label htmlFor="email" className="text-black">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mcp@example.com"
                  disabled={isLoading}
                  autoFocus
                  value={formData.email}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successEmailStep();
                    }
                  }}
                  onChange={(e) => setFormData({ email: e.target.value })}
                  required
                  className="bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
                />
              </div>
            )}
            {step === 2 && (
              <div className={cn("flex flex-col gap-2")}>
                <Label htmlFor="name" className="text-black">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Cgoing"
                  disabled={isLoading}
                  autoFocus
                  value={formData.name}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successNameStep();
                    }
                  }}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                  className="bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
                />
              </div>
            )}
            {step === 3 && (
              <div className={cn("flex flex-col gap-2")}>
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-black">
                    Password
                  </Label>
                </div>
                <PasswordInput
                  id="password"
                  placeholder="********"
                  disabled={isLoading}
                  autoFocus
                  value={formData.password}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      e.nativeEvent.isComposing === false
                    ) {
                      successPasswordStep();
                    }
                  }}
                  onChange={(e) => setFormData({ password: e.target.value })}
                  required
                  className="bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
                />
              </div>
            )}
            <p className="text-black text-xs mb-6">{steps[step - 1]}</p>
            <div className="flex flex-row-reverse gap-2">
              <Button
                tabIndex={0}
                disabled={isLoading}
                className="w-1/2 bg-black hover:bg-gray-800 text-white"
                style={{ backgroundColor: "black", color: "white" }}
                onClick={() => {
                  if (step === 1) successEmailStep();
                  if (step === 2) successNameStep();
                  if (step === 3) successPasswordStep();
                }}
              >
                {step === 3 ? t("Auth.SignUp.createAccount") : t("Common.next")}
                {isLoading && <Loader className="size-4 ml-2" />}
              </Button>
              <Button
                tabIndex={step === 1 ? -1 : 0}
                disabled={isLoading || step === 1}
                className={cn(step === 1 && "invisible", "w-1/2")}
                variant="ghost"
                onClick={backStep}
              >
                <ChevronLeft className="size-4" />
                {t("Common.back")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
