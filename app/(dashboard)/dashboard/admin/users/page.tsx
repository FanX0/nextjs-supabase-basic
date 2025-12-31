import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateUserRole } from "@/features/users/admin.actions";
import { UserRole } from "@/features/auth/auth.types";
import Link from "next/link";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // 1. Verify Admin Access
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    redirect("/dashboard/admin"); // Redirect to main admin page which shows denied message
  }

  // 2. Fetch All Users (Profiles) using the Public view policy (or Admin view if strict)
  // Since we have a public view policy, this works.
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Link
          href="/dashboard/admin"
          className="text-indigo-600 hover:text-indigo-500 mr-4"
        >
          &larr; Back to Admin Panel
        </Link>
        <Link
          href="/dashboard/admin/users/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Invite User
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {(users || []).map((profile) => (
            <li key={profile.id}>
              <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                <div>
                  <Link
                    href={`/dashboard/admin/users/${profile.id}`}
                    className="block group"
                  >
                    <p className="text-sm font-medium text-indigo-600 truncate group-hover:text-indigo-800 transition-colors">
                      {profile.full_name || "No Name"}
                    </p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-700">
                      {profile.id}
                    </p>
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      profile.role === "super_admin"
                        ? "bg-red-100 text-red-800"
                        : profile.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : profile.role === "user"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {profile.role}
                  </span>

                  {/* Role Change Forms */}
                  {profile.id !== user.id && (
                    <div className="flex space-x-2">
                      {/* Promote to Admin - ONLY SUPER ADMIN */}
                      {currentUserProfile.role === "super_admin" &&
                        profile.role !== "admin" &&
                        profile.role !== "super_admin" && (
                          <form
                            action={async () => {
                              "use server";
                              await updateUserRole(profile.id, "admin");
                            }}
                          >
                            <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                              Make Admin
                            </button>
                          </form>
                        )}

                      {/* Demote to User */}
                      {profile.role !== "user" &&
                        (currentUserProfile.role === "super_admin" ||
                          (profile.role !== "admin" &&
                            profile.role !== "super_admin")) && (
                          <form
                            action={async () => {
                              "use server";
                              await updateUserRole(profile.id, "user");
                            }}
                          >
                            <button className="text-xs text-orange-600 hover:text-orange-800 underline">
                              Make User
                            </button>
                          </form>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
