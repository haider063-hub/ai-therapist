"use client";

import dynamic from "next/dynamic";

const ChatBotVoice = dynamic(
  () => import("@/components/chat-bot-voice").then((mod) => mod.ChatBotVoice),
  {
    ssr: false,
  },
);

const UserSettingsPopup = dynamic(
  () =>
    import("@/components/user/user-detail/user-settings-popup").then(
      (mod) => mod.UserSettingsPopup,
    ),
  {
    ssr: false,
  },
);

export function AppPopupProvider({
  userSettingsComponent,
}: {
  userSettingsComponent: React.ReactNode;
}) {
  return (
    <>
      <UserSettingsPopup userSettingsComponent={userSettingsComponent} />
      <ChatBotVoice />
    </>
  );
}
