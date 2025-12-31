import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
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
            <p>
              <span className="text-gray-500">ID:</span>{" "}
              <span className="font-mono text-xs">{user.id}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-2">My Projects</h3>
          <p className="text-gray-500 italic">No projects created yet.</p>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
