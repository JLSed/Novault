import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signOut, getUserProfile, getUserSecrets } from "./actions";
import HomeClient from "./HomeClient";

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
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">{user.email}</h1>
        <span className="text-sm text-gray-500 capitalize">
          Role: {userProfile?.role || "user"}
        </span>
        {hasMasterKey ? (
          <span className="text-sm text-green-600">
            ✓ Master key configured
          </span>
        ) : (
          <span className="text-sm text-orange-500">⚠ Master key not set</span>
        )}
      </div>

      <form action={signOut}>
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </HomeClient>
  );
}
