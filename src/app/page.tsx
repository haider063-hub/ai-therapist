import { getSession } from "auth/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // Check if user has selected a therapist
  // For now, we'll redirect to voice-chat as the default
  // You can add logic here to check therapist selection status
  redirect("/voice-chat");
}
