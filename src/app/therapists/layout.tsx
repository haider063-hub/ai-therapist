import { TherapistSelectionHeader } from "@/components/therapist-selection-header";
import { getSession } from "lib/auth/server";
import { redirect } from "next/navigation";

export default async function TherapistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TherapistSelectionHeader />
      {children}
    </div>
  );
}
