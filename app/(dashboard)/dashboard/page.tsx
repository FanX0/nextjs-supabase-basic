import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserProjectCount } from "@/features/projects/project.queries";
import { UserStats } from "@/components/dashboard/UserStats";
import { getSubscription } from "@/features/billing/subscription.queries";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projectCount = await getUserProjectCount();
  const subscription = await getSubscription();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Dashboard Overview</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Welcome back,{" "}
        <span className="font-semibold text-indigo-600">
          {profile?.full_name || user.email}
        </span>
        !
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">Profile Details</h3>
          <div className="space-y-2">
            <p>
              <span className="text-gray-500">Email:</span> {user.email}
            </p>
            <p>
              <span className="text-gray-500">Role:</span>{" "}
              {profile?.role || "Guest"}
            </p>
          </div>
        </div>

        <UserStats totalProjects={projectCount} subscription={subscription} />

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">My Projects</h3>
          <p className="text-gray-500 italic mb-4">
            Manage your projects here.
          </p>
          <div className="flex space-x-3">
            <Link
              href="/dashboard/projects"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              View All
            </Link>
            {!subscription && (projectCount || 0) >= 2 ? (
              <Link
                href="/pricing"
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded hover:from-indigo-600 hover:to-purple-600 transition shadow-md flex items-center"
              >
                <span className="mr-2">🚀</span> Upgrade to Create
              </Link>
            ) : (
              <Link
                href="/dashboard/projects/create"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Create Project
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
