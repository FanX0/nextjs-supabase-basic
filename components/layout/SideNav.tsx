"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/auth.actions";
import { User } from "@supabase/supabase-js";

export type SideNavProps = {
  user: User;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
  } | null;
};

export function SideNav({ user, profile }: SideNavProps) {
  const pathname = usePathname();

  const displayName =
    profile?.full_name || user.user_metadata?.full_name || "User";
  const displayAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayEmail = user.email;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700">
        <Link
          href="/dashboard"
          className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          My App
        </Link>
      </div>

      {/* User Info / Avatar Section */}
      <div className="p-4 border-b dark:border-gray-700 flex items-center space-x-3">
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
            {displayEmail?.[0].toUpperCase() || "U"}
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
        </div>
      </div>

      <nav className="mt-4 space-y-1 flex-1">
        <Link
          href="/dashboard"
          className={`block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            pathname === "/dashboard"
              ? "bg-gray-100 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          Overview
        </Link>
        <Link
          href="/dashboard/projects"
          className={`block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            pathname.startsWith("/dashboard/projects")
              ? "bg-gray-100 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          Projects
        </Link>
        <Link
          href="/dashboard/user"
          className={`block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            pathname === "/dashboard/user"
              ? "bg-gray-100 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          User Profile
        </Link>
        <Link
          href="/dashboard/admin"
          className={`block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            pathname.startsWith("/dashboard/admin")
              ? "bg-gray-100 dark:bg-gray-700 font-semibold"
              : ""
          }`}
        >
          Admin Panel
        </Link>
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            href="/"
            className="block px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t dark:border-gray-700">
        <form action={signOut}>
          <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition">
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
