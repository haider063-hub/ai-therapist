"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "ui/card";
import { Button } from "ui/button";
import { Label } from "ui/label";
import { Shield, UserCheck, AlertTriangle, Trash2, Mic } from "lucide-react";
import { BasicUserWithLastLogin } from "app-types/user";
import { UserRoleBadges } from "./user-role-badges";
import { UserStatusBadge } from "./user-status-badge";
import { UserRoleSelector } from "./user-role-selection-dialog";
import { UserDeleteDialog } from "./user-delete-dialog";
import { useProfileTranslations } from "@/hooks/use-profile-translations";
import { getIsUserAdmin } from "lib/user/utils";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { getTherapistById, Therapist } from "@/lib/constants/therapists";
import { useRouter } from "next/navigation";

interface UserAccessCardProps {
  user: BasicUserWithLastLogin;
  currentUserId: string;
  userAccountInfo?: {
    hasPassword: boolean;
    oauthProviders: string[];
  };
  onUserDetailsUpdate: (user: Partial<BasicUserWithLastLogin>) => void;
  view?: "admin" | "user";
  disabled?: boolean;
}

export function UserAccessCard({
  user,
  currentUserId,
  userAccountInfo,
  onUserDetailsUpdate,
  view,
  disabled = false,
}: UserAccessCardProps) {
  const { t, tCommon } = useProfileTranslations(view);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(
    null,
  );
  const [therapistLoading, setTherapistLoading] = useState(true);
  const router = useRouter();

  const handleUserUpdate = (updatedUser: Partial<BasicUserWithLastLogin>) => {
    onUserDetailsUpdate(updatedUser);
  };

  // Fetch selected therapist for the current user
  useEffect(() => {
    const fetchSelectedTherapist = async () => {
      if (user.id !== currentUserId) {
        setTherapistLoading(false);
        return; // Only show therapist info for current user
      }

      try {
        const response = await fetch("/api/user/select-therapist");
        const data = await response.json();

        if (data.selectedTherapistId) {
          const therapist = getTherapistById(data.selectedTherapistId);
          setSelectedTherapist(therapist || null);
        }
      } catch (error) {
        console.error("Failed to fetch selected therapist:", error);
      } finally {
        setTherapistLoading(false);
      }
    };

    fetchSelectedTherapist();
  }, [user.id, currentUserId]);

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Account & Therapy Settings
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your account status and voice therapy preferences
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Roles Section - Only show for admin users */}
          {user.role?.includes("admin") && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {t("roles")}
                </Label>
                {user.id !== currentUserId && view === "admin" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowRoleDialog(true)}
                    disabled={disabled}
                    className="h-8 text-xs !bg-black !text-white hover:!bg-gray-800"
                    data-testid="edit-roles-button"
                  >
                    {tCommon("editRoles")}
                  </Button>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-3">
                <UserRoleBadges
                  user={user}
                  showBanned={false}
                  view={view}
                  onRoleClick={
                    user.id !== currentUserId && view === "admin"
                      ? () => setShowRoleDialog(true)
                      : undefined
                  }
                  disabled={user.id === currentUserId || disabled}
                  className="mt-0"
                />
                {user.id === currentUserId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("cannotModifyOwnRole")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Account Status Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t("accountStatus")}
            </Label>

            <div className="rounded-lg border bg-muted/30 p-3">
              <UserStatusBadge
                user={user}
                onStatusChange={handleUserUpdate}
                currentUserId={currentUserId}
                disabled={disabled}
                showClickable={view === "admin"}
                view={view}
              />
              {user.banned && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t("userBannedDescription")}
                </p>
              )}
            </div>
          </div>

          {/* Voice Therapy Section - Only show for current user */}
          {user.id === currentUserId && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice Therapy
              </Label>

              <div className="rounded-lg border bg-muted/30 p-3">
                {therapistLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                    Loading therapist information...
                  </div>
                ) : selectedTherapist ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full bg-white">
                        <AvatarImage
                          src={selectedTherapist.avatar}
                          alt={selectedTherapist.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-white text-black text-sm font-bold uppercase">
                          {selectedTherapist.name.split(" ")[1]?.charAt(0) ||
                            selectedTherapist.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {selectedTherapist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedTherapist.specialization} •{" "}
                          {selectedTherapist.language}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push("/therapists")}
                      className="h-8 text-xs !bg-black !text-white hover:!bg-gray-800"
                    >
                      Change Therapist
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        No therapist selected
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select a therapist to start voice therapy sessions
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push("/therapists")}
                      className="h-8 text-xs !bg-black !text-white hover:!bg-gray-800"
                    >
                      Select Therapist
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Danger Zone Section */}
          {view === "admin" &&
            user.id !== currentUserId &&
            !getIsUserAdmin(user) && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  {tCommon("dangerZone")}
                </Label>

                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        {t("deleteUser")}
                      </p>
                      <p className="text-xs text-destructive/80">
                        {t("deleteUserPermanently")}
                      </p>
                    </div>

                    <UserDeleteDialog user={user} view={view}>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs"
                        data-testid="delete-user-button"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t("deleteUser")}
                      </Button>
                    </UserDeleteDialog>
                  </div>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      <UserRoleSelector
        user={user}
        onRoleChange={handleUserUpdate}
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        view={view}
      />
    </>
  );
}
