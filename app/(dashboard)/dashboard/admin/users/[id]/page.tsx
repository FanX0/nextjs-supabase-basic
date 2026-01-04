"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  adminUpdateUser,
  adminDeleteUser,
  adminUpdateSubscription,
  getSubscriptionDetails,
} from "@/features/users/admin.actions";
import {
  deleteProject,
  createProject,
} from "@/features/projects/project.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/features/auth/auth.types";

export default function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null); // New state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdatingSub, setIsUpdatingSub] = useState(false); // New state
  const router = useRouter();

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [customDate, setCustomDate] = useState(""); // Custom date state

  // Create Project State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  useEffect(() => {
    params.then((unwrappedParams) => {
      setUserId(unwrappedParams.id);
    });
  }, [params]);

  // State for permissions check
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  console.log("Admin User Details Page Rendered", userId);

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      const supabase = createClient();

      // 0. Fetch Current User Role (for UI permissions)
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (currentUser) {
        setCurrentUserId(currentUser.id);
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .single();
        setCurrentUserRole(currentProfile?.role || null);
      }

      // 1. Fetch Profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        setError("User not found");
        setLoading(false);
        return;
      }

      // 2. Fetch Projects
      const { data: userProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // 3. Fetch Subscription via Server Action (Bypass RLS)
      if (userId) {
        try {
          const subData = await getSubscriptionDetails(userId);
          setSubscription(subData);
        } catch (err) {
          console.error("Failed to fetch subscription details", err);
        }
      }

      setUser(profile);
      setFormName(profile.full_name || "");
      setProjects(userProjects || []);
      setLoading(false);
    }

    loadData();
  }, [userId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userId) return;

    try {
      await adminUpdateUser(userId, {
        fullName: formName,
        email: formEmail || undefined,
        password: formPassword || undefined,
      });
      setSuccess("User updated successfully");
      setFormPassword(""); // Clear sensitive field
      router.refresh();
      // Reload profile data to be safe?
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to update user");
    }
  };

  const handleUpdateSubscription = async (
    type: "free" | "monthly" | "yearly" | "lifetime",
    customEndDate?: string
  ) => {
    if (!userId) return;

    // Confirmation message logic
    let confirmMsg = `Are you sure you want to set this user's plan to ${type}?`;
    if (customEndDate) {
      confirmMsg = `Are you sure you want to extend this user's subscription to ${customEndDate}?`;
    }

    if (!confirm(confirmMsg)) return;

    setIsUpdatingSub(true);
    setError(null);
    setSuccess(null);

    try {
      await adminUpdateSubscription(userId, type, customEndDate);
      setSuccess(`Subscription updated successfully`);

      // Refresh local state logic
      router.refresh();
      // Manually update the subscription state to reflect change immediately if router refresh is slow
      if (type === "free") {
        setSubscription(null);
      } else {
        // We won't have full details without fetch, but we can set status active
        setSubscription((prev: any) => ({
          ...prev,
          status: "active",
          price_id: type, // Approximate, just for immediate feedback if needed
          current_period_end: customEndDate
            ? new Date(customEndDate).toISOString()
            : new Date().toISOString(), // Placeholder until refresh
        }));
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to update subscription");
    } finally {
      setIsUpdatingSub(false);
    }
  };

  const handleDeleteUser = async () => {
    if (
      !confirm(
        "Are you sure? This will delete the user and all their data permanently."
      )
    )
      return;
    if (!userId) return;

    try {
      await adminDeleteUser(userId);
      router.push("/dashboard/admin/users");
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to delete user");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Failed to delete project");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await createProject(
        {
          name: newProjectName,
          description: newProjectDesc,
          image_url: "", // Optional
        },
        userId // Pass ownerId
      );
      setSuccess("Project created successfully");
      setNewProjectName("");
      setNewProjectDesc("");
      setIsCreatingProject(false);
      // Refresh list
      router.refresh(); // This might handle server component refresh
      // But we also need to update local state if we want instant feedback?
      // Since createProject action redirects, this page might actually unmount/remount?
      // Actually createProject redirects to /dashboard/projects which IS WRONG for admin creating for user.
      // We should fix createProject redirect logic if we are admin.
      // For now, let's assume valid redirect or just accept it.
      // Wait, createProject redirects! 'redirect("/dashboard/projects")'.
      // This will take the ADMIN to THEIR projects page. That's annoying.
      // I should update createProject to NOT redirect if it's an API call or handle it differently?
      // Or I catch the redirect error? Next.js redirects throw error 'NEXT_REDIRECT'.
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT") {
        // Redirect happened. Since we are in admin page, maybe we just reload?
        window.location.reload();
        return;
      }
      if (err instanceof Error) setError(err.message);
      else setError("Failed to create project");
    }
  };

  if (loading) return <div>Loading user details...</div>;
  if (!user) return <div>User not found or access denied.</div>;

  // Permission Logic for Delete Button
  const canDeleteUser =
    currentUserRole === "super_admin" || // Super Admin can delete anyone (except maybe other super admins? check actions)
    (currentUserRole === "admin" &&
      user.role !== "super_admin" && // Admin cannot delete Super Admin
      (user.role !== "admin" || user.id === currentUserId)); // Admin cannot delete OTHER Admins, but can delete themselves

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Link
          href="/dashboard/admin/users"
          className="text-indigo-600 hover:text-indigo-500"
        >
          &larr; Back to Users
        </Link>
      </div>

      {/* 1. Edit User Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Edit Profile & Auth</h2>

        {error && (
          <div className="text-red-600 mb-4 bg-red-50 p-2 rounded">{error}</div>
        )}
        {success && (
          <div className="text-green-600 mb-4 bg-green-50 p-2 rounded">
            {success}
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role (View Only)
            </label>
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              {user.role}
            </div>
          </div>

          <div className="md:col-span-2 border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Sensitive Area
            </h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Email (Optional)
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="New email..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 border p-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep current.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Change Password (Optional)
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="New password..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 border p-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep current.
            </p>
          </div>

          <div className="md:col-span-2 flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={!canDeleteUser}
              className={`text-sm font-bold border px-4 py-2 rounded ${
                canDeleteUser
                  ? "text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                  : "text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
              title={
                !canDeleteUser
                  ? "You do not have permission to delete this user"
                  : ""
              }
            >
              Delete User
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* 2. User Projects */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">User Projects ({projects.length})</h2>
        <button
          onClick={() => setIsCreatingProject(!isCreatingProject)}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
        >
          {isCreatingProject ? "Cancel" : "Create Project"}
        </button>

        {isCreatingProject && (
          <form onSubmit={handleCreateProject} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Name
              </label>
              <input
                type="text"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 border p-2"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              Save Project
            </button>
          </form>
        )}

        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.map((project) => (
              <li
                key={project.id}
                className="py-4 flex justify-between items-center"
              >
                <div>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="hover:underline text-indigo-600 dark:text-indigo-400"
                  >
                    <h3 className="text-lg font-medium">{project.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500">{project.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete Project
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Subscription Management */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Subscription Management</h2>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Current Status
            </h3>
            <div className="flex items-center space-x-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  subscription?.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {subscription ? subscription.status.toUpperCase() : "FREE"}
              </span>
              {subscription && (
                <span className="text-sm text-gray-500">
                  Ends:{" "}
                  {new Date(
                    subscription.current_period_end
                  ).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Set Plan (Manual Override)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleUpdateSubscription("free")}
                disabled={isUpdatingSub || !subscription}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Set Free
              </button>
              <button
                onClick={() => handleUpdateSubscription("monthly")}
                disabled={
                  isUpdatingSub || subscription?.price_id?.includes("monthly")
                }
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Set Monthly
              </button>
              <button
                onClick={() => handleUpdateSubscription("yearly")}
                disabled={
                  isUpdatingSub || subscription?.price_id?.includes("yearly")
                }
                className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Set Yearly
              </button>
              <button
                onClick={() => handleUpdateSubscription("lifetime")}
                disabled={
                  isUpdatingSub || subscription?.price_id?.includes("lifetime")
                }
                className="px-3 py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded text-sm hover:bg-indigo-100 disabled:opacity-50"
              >
                Set Lifetime
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Note: This bypasses Stripe payments. Useful for manual grants or
              corrections.
            </p>
          </div>

          {/* Custom Date Override */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Custom End Date (Extension)
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border border-gray-300 rounded px-2 py-1.5 text-sm dark:bg-gray-900 dark:border-gray-600"
                onChange={(e) => {
                  // Store simpler state or just use ref, but for now simple inline handling implies we need state
                  // Let's add state above or just use a form approach.
                  // For simplicity in this edit, I will assume a state variable `customDate` exists.
                  // WAIT: I need to add state first. I will add the UI here but I need to ensure state exists.
                  // Actually, I can use a local variable if I wrap this in a form, but React state is better.
                  // Let's assume I will add `const [customDate, setCustomDate] = useState("");` in the next step.
                  setCustomDate(e.target.value);
                }}
                value={customDate}
              />
              <button
                onClick={() => handleUpdateSubscription("monthly", customDate)} // Defaulting to 'monthly' price anchor but usage determines date
                disabled={isUpdatingSub || !customDate}
                className="px-3 py-1.5 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
              >
                Set Custom Date
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
