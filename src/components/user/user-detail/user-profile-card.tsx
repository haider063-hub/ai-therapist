"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  MapPin,
  Heart,
  Brain,
  MessageCircle,
  Edit,
} from "lucide-react";
import { ProfileEditDialog } from "./profile-edit-dialog";
import {
  RELIGIONS,
  GENDERS,
  THERAPY_NEEDS,
  THERAPY_STYLES,
} from "@/lib/constants/profile-options";

interface UserProfileCardProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    dateOfBirth?: string | null;
    gender?: string | null;
    country?: string | null;
    religion?: string | null;
    therapyNeeds?: string | null;
    preferredTherapyStyle?: string | null;
    specificConcerns?: string | null;
    profileCompleted?: boolean;
  };
  currentUserId: string;
  view?: "admin" | "user";
}

export function UserProfileCard({
  user,
  currentUserId,
  view = "user",
}: UserProfileCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isOwnProfile = user.id === currentUserId;

  // Get therapy needs - now a single string value
  const therapyNeeds = user.therapyNeeds ? [user.therapyNeeds] : [];

  // Helper to get labels
  const getGenderLabel = (value: string) =>
    GENDERS.find((g) => g.value === value)?.label || value;
  const getReligionLabel = (value: string) =>
    RELIGIONS.find((r) => r.value === value)?.label || value;
  const getTherapyStyleLabel = (value: string) =>
    THERAPY_STYLES.find((s) => s.value === value)?.label || value;
  const getTherapyNeedLabel = (value: string) =>
    THERAPY_NEEDS.find((n) => n.value === value)?.label || value;

  // Calculate age from date of birth
  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                {isOwnProfile ? "Your" : `${user.name}'s`} personal information
                for AI personalization
              </CardDescription>
            </div>
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="!bg-black !text-white hover:!bg-gray-800"
              >
                <Edit className="h-4 w-4 mr-2 text-white" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user.profileCompleted ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Profile not completed yet</p>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Complete Profile
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Age/Date of Birth */}
              {user.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Age</p>
                    <p className="text-sm text-muted-foreground">
                      {getAge(user.dateOfBirth)} years old
                    </p>
                  </div>
                </div>
              )}

              {/* Gender */}
              {user.gender && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Gender</p>
                    <p className="text-sm text-muted-foreground">
                      {getGenderLabel(user.gender)}
                    </p>
                  </div>
                </div>
              )}

              {/* Country */}
              {user.country && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Country</p>
                    <p className="text-sm text-muted-foreground">
                      {user.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Religion */}
              {user.religion && (
                <div className="flex items-start gap-3">
                  <Heart className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Religion/Beliefs</p>
                    <p className="text-sm text-muted-foreground">
                      {getReligionLabel(user.religion)}
                    </p>
                  </div>
                </div>
              )}

              {/* Therapy Needs */}
              {therapyNeeds.length > 0 && (
                <div className="flex items-start gap-3">
                  <Brain className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Therapy Needs</p>
                    <div className="flex flex-wrap gap-2">
                      {therapyNeeds.map((need: string) => (
                        <Badge key={need} variant="secondary">
                          {getTherapyNeedLabel(need)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Preferred Therapy Style */}
              {user.preferredTherapyStyle && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Preferred Approach</p>
                    <p className="text-sm text-muted-foreground">
                      {getTherapyStyleLabel(user.preferredTherapyStyle)}
                    </p>
                  </div>
                </div>
              )}

              {/* Specific Concerns */}
              {user.specificConcerns && (
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Specific Concerns</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {user.specificConcerns}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Edit Dialog */}
      {isOwnProfile && (
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
        />
      )}
    </>
  );
}
