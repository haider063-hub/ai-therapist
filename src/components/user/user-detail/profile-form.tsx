"use client";

import { useState } from "react";
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
import { Loader, Info } from "lucide-react";
import {
  COUNTRIES,
  RELIGIONS,
  GENDERS,
  THERAPY_NEEDS,
  THERAPY_STYLES,
} from "@/lib/constants/profile-options";

interface ProfileFormProps {
  initialData?: {
    dateOfBirth: string;
    gender: string;
    country: string;
    religion: string;
    therapyNeeds: string[];
    preferredTherapyStyle: string;
    specificConcerns: string;
  };
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function ProfileForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
  showCancel = false,
  onCancel,
}: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [formData, setFormData] = useState(
    initialData || {
      dateOfBirth: "",
      gender: "",
      country: "",
      religion: "",
      therapyNeeds: [],
      preferredTherapyStyle: "",
      specificConcerns: "",
    },
  );

  const handleTherapyNeedToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      therapyNeeds: prev.therapyNeeds.includes(value)
        ? prev.therapyNeeds.filter((need: string) => need !== value)
        : [...prev.therapyNeeds, value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.dateOfBirth ||
      !formData.gender ||
      !formData.country ||
      !formData.religion ||
      !formData.therapyNeeds ||
      formData.therapyNeeds.length === 0 ||
      !formData.preferredTherapyStyle
    ) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Date of Birth */}
      <div className="space-y-2 w-full">
        <Label htmlFor="dateOfBirth">
          Date of Birth{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
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
          Helps provide age-appropriate therapy guidance
        </p>
      </div>

      {/* Gender */}
      <div className="space-y-2 w-full">
        <Label>
          Gender{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
        </Label>
        <Select
          value={formData.gender}
          onValueChange={(value) => setFormData({ ...formData, gender: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            {GENDERS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Country */}
      <div className="space-y-2 w-full">
        <Label>
          Country{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
        </Label>
        <Select
          value={formData.country}
          onValueChange={(value) =>
            setFormData({ ...formData, country: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <div className="sticky top-0 bg-background p-2 border-b">
              <Input
                placeholder="Search..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="h-8"
              />
            </div>
            {COUNTRIES.filter((c) =>
              c.toLowerCase().includes(countrySearch.toLowerCase()),
            ).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Religion */}
      <div className="space-y-2 w-full">
        <Label>
          Religion/Beliefs{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
        </Label>
        <Select
          value={formData.religion}
          onValueChange={(value) =>
            setFormData({ ...formData, religion: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select religion" />
          </SelectTrigger>
          <SelectContent>
            {RELIGIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Therapy Needs */}
      <div className="space-y-3 w-full">
        <Label>
          Therapy Needs{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {THERAPY_NEEDS.map((need) => (
            <div key={need.value} className="flex items-center space-x-2">
              <Checkbox
                id={need.value}
                checked={formData.therapyNeeds.includes(need.value)}
                onCheckedChange={() => handleTherapyNeedToggle(need.value)}
              />
              <label htmlFor={need.value} className="text-sm cursor-pointer">
                {need.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Therapy Style */}
      <div className="space-y-2 w-full">
        <Label>
          Therapy Approach{" "}
          <span className="text-xs text-muted-foreground">(Required)</span>
        </Label>
        <Select
          value={formData.preferredTherapyStyle}
          onValueChange={(value) =>
            setFormData({ ...formData, preferredTherapyStyle: value })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select approach" />
          </SelectTrigger>
          <SelectContent>
            {THERAPY_STYLES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Specific Concerns */}
      <div className="space-y-2 w-full">
        <Label>
          Specific Concerns{" "}
          <span className="text-xs text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          placeholder="Tell us more..."
          rows={3}
          value={formData.specificConcerns}
          onChange={(e) =>
            setFormData({ ...formData, specificConcerns: e.target.value })
          }
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1"
          disabled={
            loading ||
            !formData.dateOfBirth ||
            !formData.gender ||
            !formData.country ||
            !formData.religion ||
            formData.therapyNeeds.length === 0 ||
            !formData.preferredTherapyStyle
          }
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              {submitLabel}...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
