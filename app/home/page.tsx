import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserProfile, getUserSecrets } from "./actions";
import HomeClient from "./HomeClient";
import VerifyMasterKey from "@/components/test/VerifyMasterKey";
import MasterKeyDeriver from "@/components/test/MasterKeyDeriver";
import { HomeNavBar } from "@/components/HomeNavbar";

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
    <>
      <HomeNavBar
        userEmail={user.email || ""}
        userRole={userProfile?.role || "user"}
        hasMasterKey={hasMasterKey}
      />
      <HomeClient
        userId={user.id}
        userEmail={user.email || ""}
        hasMasterKey={hasMasterKey}
      >
        <div className="flex flex-col items-center gap-4 p-8">
          {hasMasterKey && <VerifyMasterKey userId={user.id} />}
          <MasterKeyDeriver userEmail={user.email || ""} />
        </div>
      </HomeClient>
    </>
  );
}
