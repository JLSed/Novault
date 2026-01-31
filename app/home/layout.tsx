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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <HomeNavBar
            userEmail={user.email || ""}
            userRole={userProfile?.role || "user"}
            hasMasterKey={hasMasterKey}
          />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
