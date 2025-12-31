"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { inviteUser } from "@/features/users/admin.actions";
import { UserRole } from "@/features/auth/auth.types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["user", "admin", "super_admin"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function InviteUserPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const router = useRouter();

  // Fetch current user role
  useEffect(() => {
    async function fetchRole() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setCurrentUserRole(data?.role || null);
      }
    }
    fetchRole();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "user",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    // ... existing onSubmit
    setError(null);
    setSuccess(null);
    try {
      await inviteUser(data.email, data.role as UserRole);
      setSuccess(`Invitation sent to ${data.email}`);
      router.refresh();
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Failed to send invitation");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ... header ... */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invite User</h1>
        <Link
          href="/dashboard/admin/users"
          className="text-indigo-600 hover:text-indigo-500"
        >
          &larr; Back to Users
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ... alerts ... */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 p-4 rounded text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-200 p-4 rounded text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white sm:text-sm p-2 border"
              placeholder="colleague@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              {...register("role")}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white sm:text-sm p-2 border"
            >
              <option value="user">User</option>
              {currentUserRole === "super_admin" && (
                <>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </>
              )}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
