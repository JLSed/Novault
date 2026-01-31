"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import SetupMasterKeyModal from "@/components/SetupMasterKeyModal";

interface HomeClientProps {
  children: ReactNode;
  userId: string;
  userEmail: string;
  hasMasterKey: boolean;
  userRole?: string;
}

export default function HomeClient({
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
    <div className="flex flex-col h-full">
      <SetupMasterKeyModal
        isOpen={showModal}
        userEmail={userEmail}
        userId={userId}
        onComplete={handleSetupComplete}
      />
      <div className="flex-1 w-full h-full">{children}</div>
    </div>
  );
}
