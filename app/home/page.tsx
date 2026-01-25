import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">user: {user.email}</h1>
      <p className="text-lg">masterKey: {user.email}</p>
      <p>You are logged in!</p>

      <form action={signOut}>
        <button className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out
        </button>
      </form>
    </div>
  );
}
