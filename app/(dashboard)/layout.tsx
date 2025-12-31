import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/auth.actions";
import Link from "next/link";
import { SideNav } from "@/components/layout/SideNav";

import { RealtimeSubscriptionListener } from "@/components/billing/RealtimeSubscriptionListener";

export default async function DashboardLayout({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <RealtimeSubscriptionListener />
      <SideNav user={user} profile={profile} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
