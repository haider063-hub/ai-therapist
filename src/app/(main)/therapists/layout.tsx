import { getSession } from "auth/server";
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
    <div className="min-h-screen relative">
      <div className="echonest-gradient-bg"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
