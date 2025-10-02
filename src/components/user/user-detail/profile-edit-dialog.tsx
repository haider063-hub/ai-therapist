"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { toast } from "sonner";
import { mutate } from "swr";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    dateOfBirth?: string | null;
    gender?: string | null;
    country?: string | null;
    religion?: string | null;
    therapyNeeds?: string | null;
    preferredTherapyStyle?: string | null;
    specificConcerns?: string | null;
  };
}

export function ProfileEditDialog({
  open,
  onOpenChange,
  user,
}: ProfileEditDialogProps) {
  const [initialData, setInitialData] = useState({
    dateOfBirth: "",
    gender: "",
    country: "",
    religion: "",
    therapyNeeds: [] as string[],
    preferredTherapyStyle: "",
    specificConcerns: "",
  });

  useEffect(() => {
    if (open) {
      setInitialData({
        dateOfBirth: user.dateOfBirth || "",
        gender: user.gender || "",
        country: user.country || "",
        religion: user.religion || "",
        therapyNeeds: user.therapyNeeds ? JSON.parse(user.therapyNeeds) : [],
        preferredTherapyStyle: user.preferredTherapyStyle || "",
        specificConcerns: user.specificConcerns || "",
      });
    }
  }, [open, user]);

  const handleSubmit = async (data: any) => {
    const response = await fetch("/api/user/profile-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success("Profile updated!");
      mutate("/api/user/details");
      onOpenChange(false);
    } else {
      const error = await response.json();
      throw new Error(error.message || "Failed to update");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your information for better AI personalization
          </DialogDescription>
        </DialogHeader>

        <Alert className="mb-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your information is encrypted and used only for AI personalization
          </AlertDescription>
        </Alert>

        <ProfileForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          showCancel
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
