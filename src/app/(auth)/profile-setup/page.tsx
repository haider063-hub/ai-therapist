"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader, Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  COUNTRIES,
  RELIGIONS,
  GENDERS,
  THERAPY_NEEDS,
  THERAPY_STYLES,
} from "@/lib/constants/profile-options";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    country: "",
    religion: "",
    therapyNeeds: [] as string[],
    preferredTherapyStyle: "",
    specificConcerns: "",
  });

  const handleTherapyNeedToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      therapyNeeds: prev.therapyNeeds.includes(value)
        ? prev.therapyNeeds.filter((need) => need !== value)
        : [...prev.therapyNeeds, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.dateOfBirth) {
      toast.error("Please enter your date of birth");
      return;
    }
    if (!formData.gender) {
      toast.error("Please select your gender");
      return;
    }
    if (!formData.country) {
      toast.error("Please select your country");
      return;
    }
    if (!formData.religion) {
      toast.error("Please select your religion/beliefs");
      return;
    }
    if (!formData.therapyNeeds || formData.therapyNeeds.length === 0) {
      toast.error("Please select at least one therapy need");
      return;
    }
    if (!formData.preferredTherapyStyle) {
      toast.error("Please select your preferred therapy approach");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/profile-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Profile setup complete!");
        router.push("/therapists");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-4 overflow-y-auto chat-scrollbar">
      {/* EchoNest AI Therapy Branding - Sticky */}
      <div className="sticky top-0 z-10 text-center mb-6 mt-8 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          EchoNest AI Therapy
        </h1>
        <p className="text-white/80 text-sm">Your compassionate AI therapist</p>
      </div>

      <Card className="w-full max-w-3xl bg-white shadow-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-black">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-black">
            Help us personalize your therapy experience. This information helps
            our AI provide better support tailored to your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-white border border-black">
            <Shield className="h-4 w-4 text-black" />
            <AlertDescription className="text-black">
              Your information is encrypted and used only to personalize your AI
              therapy sessions. You can edit or delete this data anytime from
              your profile settings.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date of Birth */}
            <div className="space-y-2 w-full">
              <Label htmlFor="dateOfBirth" className="text-black">
                Date of Birth{" "}
                <span className="text-sm text-black">(Required)</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
                className="bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
              />
              <p className="text-xs text-black flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps us provide age-appropriate therapy guidance
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-2 w-full">
              <Label htmlFor="gender" className="text-black">
                Gender <span className="text-sm text-black">(Required)</span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="w-full bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-black">
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2 w-full">
              <Label htmlFor="country" className="text-black">
                Country <span className="text-sm text-black">(Required)</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              >
                <SelectTrigger className="w-full bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-white border border-black">
                  <div className="sticky top-0 bg-white p-2 border-b border-black">
                    <Input
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="h-8 bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {COUNTRIES.filter((country) =>
                    country.toLowerCase().includes(countrySearch.toLowerCase()),
                  ).map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-black flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps with time zones and culturally relevant recommendations
              </p>
            </div>

            {/* Religion */}
            <div className="space-y-2 w-full">
              <Label htmlFor="religion" className="text-black">
                Religion/Beliefs{" "}
                <span className="text-sm text-black">(Required)</span>
              </Label>
              <Select
                value={formData.religion}
                onValueChange={(value) =>
                  setFormData({ ...formData, religion: value })
                }
              >
                <SelectTrigger className="w-full bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white">
                  <SelectValue placeholder="Select your religion/beliefs" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-black">
                  {RELIGIONS.map((religion) => (
                    <SelectItem key={religion.value} value={religion.value}>
                      {religion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-black flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps provide therapy advice that respects your values and
                beliefs
              </p>
            </div>

            {/* Therapy Needs */}
            <div className="space-y-3 w-full">
              <Label className="text-black">
                What brings you here?{" "}
                <span className="text-sm text-black">
                  <span className="sm:hidden">(Required)</span>
                  <span className="hidden sm:inline">
                    (Required - Select all that apply)
                  </span>
                </span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {THERAPY_NEEDS.map((need) => (
                  <div key={need.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={need.value}
                      checked={formData.therapyNeeds.includes(need.value)}
                      onCheckedChange={() =>
                        handleTherapyNeedToggle(need.value)
                      }
                    />
                    <label
                      htmlFor={need.value}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-black"
                    >
                      {need.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Therapy Style */}
            <div className="space-y-2 w-full">
              <Label htmlFor="therapyStyle" className="text-black">
                Preferred Therapy Approach{" "}
                <span className="text-sm text-black">(Required)</span>
              </Label>
              <Select
                value={formData.preferredTherapyStyle}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferredTherapyStyle: value })
                }
              >
                <SelectTrigger className="w-full bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white">
                  <SelectValue placeholder="Select your preferred approach" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-black">
                  {THERAPY_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-black flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                The AI will adapt its communication style to match your
                preference
              </p>
            </div>

            {/* Specific Concerns */}
            <div className="space-y-2 w-full">
              <Label htmlFor="concerns" className="text-black">
                Any Specific Concerns?{" "}
                <span className="text-sm text-black">(Optional)</span>
              </Label>
              <Textarea
                id="concerns"
                placeholder="Tell us more about what you'd like help with..."
                rows={4}
                value={formData.specificConcerns}
                onChange={(e) =>
                  setFormData({ ...formData, specificConcerns: e.target.value })
                }
                className="bg-white text-black border-1 border-black focus:border-black focus:ring-2 focus:ring-blue-200 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white"
                style={{ backgroundColor: "black", color: "white" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile & Continue"
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-black mt-4">
              You can update your profile anytime from your account settings
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Bottom spacing to prevent content cutoff */}
      <div className="h-8"></div>
    </div>
  );
}
