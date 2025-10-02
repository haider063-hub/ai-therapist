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

const THERAPY_NEEDS = [
  { value: "stress", label: "Stress Management" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "relationship", label: "Relationship Issues" },
  { value: "self-improvement", label: "Self-Improvement" },
  { value: "trauma", label: "Trauma / Grief" },
  { value: "work-life", label: "Work-Life Balance" },
  { value: "other", label: "Other" },
];

const THERAPY_STYLES = [
  { value: "cbt", label: "CBT (Cognitive Behavioral Therapy)" },
  { value: "mindfulness", label: "Mindfulness-based" },
  { value: "supportive", label: "Supportive Counseling" },
  { value: "psychodynamic", label: "Psychodynamic Therapy" },
  { value: "other", label: "Other" },
];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
    country: "",
    location: "",
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
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Profile setup complete!");
        router.push("/");
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

  const handleSkip = async () => {
    setLoading(true);
    try {
      await fetch("/api/user/profile-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      });
      router.push("/");
    } catch (error) {
      console.error("Error:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your therapy experience. All fields are optional
            and can be updated later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your information is encrypted and used only to personalize your AI
              therapy sessions. You can edit or delete this data anytime from
              your profile settings.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps us provide age-appropriate therapy guidance
              </p>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">
                Country{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Input
                id="country"
                placeholder="e.g., United States, United Kingdom"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps with time zones and culturally relevant recommendations
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                City/Region{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Input
                id="location"
                placeholder="e.g., London, New York"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Religion */}
            <div className="space-y-2">
              <Label htmlFor="religion">
                Religion/Beliefs{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Input
                id="religion"
                placeholder="e.g., Christianity, Islam, Buddhism, Atheist, etc."
                value={formData.religion}
                onChange={(e) =>
                  setFormData({ ...formData, religion: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Helps provide therapy advice that respects your values and
                beliefs
              </p>
            </div>

            {/* Therapy Needs */}
            <div className="space-y-3">
              <Label>
                What brings you here?{" "}
                <span className="text-sm text-muted-foreground">
                  (Select all that apply)
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {need.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Therapy Style */}
            <div className="space-y-2">
              <Label htmlFor="therapyStyle">
                Preferred Therapy Approach{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Select
                value={formData.preferredTherapyStyle}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferredTherapyStyle: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your preferred approach" />
                </SelectTrigger>
                <SelectContent>
                  {THERAPY_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                The AI will adapt its communication style to match your
                preference
              </p>
            </div>

            {/* Specific Concerns */}
            <div className="space-y-2">
              <Label htmlFor="concerns">
                Any Specific Concerns?{" "}
                <span className="text-sm text-muted-foreground">
                  (Optional)
                </span>
              </Label>
              <Textarea
                id="concerns"
                placeholder="Tell us more about what you'd like help with..."
                rows={4}
                value={formData.specificConcerns}
                onChange={(e) =>
                  setFormData({ ...formData, specificConcerns: e.target.value })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={loading}
                className="flex-1"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can update your profile anytime from Settings
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
