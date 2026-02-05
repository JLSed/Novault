import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserProfile, getUserSecrets } from "./actions";
import HomeClient from "./HomeClient";
import VerifyMasterKey from "@/components/test/VerifyMasterKey";
import MasterKeyDeriver from "@/components/test/MasterKeyDeriver";
import FileEncryptor from "@/components/test/FileEncryptor";
import FileDecryptor from "@/components/test/FileDecryptor";
import StorageBucketUploader from "@/components/test/StorageBucketUploader";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(user.id);
  const userSecrets = await getUserSecrets(user.id);
  const hasMasterKey = !!userSecrets;

  return (
    <HomeClient
      userId={user.id}
      userEmail={user.email || ""}
      hasMasterKey={hasMasterKey}
      userRole={userProfile?.role || "user"}
    >
      <div className="grid grid-cols-2 gap-4 p-8">
        {hasMasterKey && <VerifyMasterKey userId={user.id} />}
        <MasterKeyDeriver />
        <FileEncryptor userId={user.id} />
        <FileDecryptor userId={user.id} />
        <StorageBucketUploader />
      </div>
    </HomeClient>
  );
}
