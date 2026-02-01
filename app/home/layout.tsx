import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
import { HomeNavBar } from "@/components/HomeNavbar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserProfile, getUserSecrets } from "./actions";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  let formattedName = user.email || "";
  if (userProfile?.first_name && userProfile?.last_name) {
    const firstInitial = userProfile.first_name.charAt(0).toUpperCase();
    const middleInitial = userProfile.middle_name
      ? `${userProfile.middle_name.charAt(0).toUpperCase()}. `
      : "";
    formattedName = `${firstInitial}. ${middleInitial}${userProfile.last_name}`;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <HomeNavBar
            userEmail={user.email || ""}
            userName={formattedName}
            userRole={userProfile?.role || "user"}
            hasMasterKey={hasMasterKey}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
