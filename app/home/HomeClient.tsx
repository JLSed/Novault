"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsoleProvider } from "@/components/ConsoleContext";
import Console from "@/components/CryptoConsole";
import { useConsole } from "@/components/ConsoleContext";
import SetupMasterKeyModal from "@/components/SetupMasterKeyModal";

function GlobalConsole() {
  const { logs } = useConsole();
  return <Console title="Web Assembly" logs={logs} height="h-48" />;
}

interface HomeClientProps {
  children: ReactNode;
  userId: string;
  userEmail: string;
  hasMasterKey: boolean;
}

function HomeClientContent({
  children,
  userId,
  userEmail,
  hasMasterKey,
}: HomeClientProps) {
  const [showModal, setShowModal] = useState(!hasMasterKey);
  const router = useRouter();

  const handleSetupComplete = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <SetupMasterKeyModal
        isOpen={showModal}
        userEmail={userEmail}
        userId={userId}
        onComplete={handleSetupComplete}
      />
      <div className="flex-1 w-full h-full">{children}</div>
      <GlobalConsole />
    </div>
  );
}

export default function HomeClient({
  children,
  userId,
  userEmail,
  hasMasterKey,
}: HomeClientProps) {
  return (
    <ConsoleProvider>
      <HomeClientContent
        userId={userId}
        userEmail={userEmail}
        hasMasterKey={hasMasterKey}
      >
        {children}
      </HomeClientContent>
    </ConsoleProvider>
  );
}
