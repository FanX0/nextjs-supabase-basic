import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSystemStats } from "@/features/users/admin.actions";
import { AdminStatsChart } from "@/components/admin/AdminStatsChart";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
          You do not have permission to view this page.
        </p>
        <p className="text-sm text-gray-500">
          Current Role:{" "}
          <span className="font-mono font-bold">
            {profile?.role || "Guest"}
          </span>
        </p>
      </div>
    );
  }

  const stats = await getSystemStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Admin Panel</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Welcome, Administrator. You have full access to system settings.
      </p>

      <AdminStatsChart
        totalUsers={stats.totalUsers}
        totalProjects={stats.totalProjects}
        totalSubscriptions={stats.totalSubscriptions}
        allTimeSubscriptions={stats.allTimeSubscriptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-indigo-600">User Management</h3>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            View and manage all registered users.
          </p>
          <a
            href="/dashboard/admin/users"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Manage Users &rarr;
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-indigo-600">
            Project Categories
          </h3>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            Manage categories for user projects.
          </p>
          <a
            href="/dashboard/admin/categories"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Manage Categories &rarr;
          </a>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-indigo-600">System Logs</h3>
          <p className="text-sm text-gray-500 mt-2">
            Check error logs and access history.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-indigo-600">Global Settings</h3>
          <p className="text-sm text-gray-500 mt-2">
            Update application configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
