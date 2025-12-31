"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminStatsChartProps {
  totalUsers: number;
  totalProjects: number;
  totalSubscriptions: number;
  allTimeSubscriptions: number;
}

export function AdminStatsChart({
  totalUsers,
  totalProjects,
  totalSubscriptions,
  allTimeSubscriptions,
}: AdminStatsChartProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for ANY change in projects or profiles tables
    const channel = supabase
      .channel("admin_stats_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          console.log("Projects changed!", payload);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("Profiles changed!", payload);
          router.refresh();
        }
      )
      // Listen for subscriptions (Admin only sees this if RLS allows, but refresh works anyway)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        (payload) => {
          console.log("Subscriptions changed!", payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  // Determine the max value to scale the bars relative to the largest item
  // Ensure a minimum scale of 10 so bars aren't full width for very small numbers
  const max = Math.max(
    totalUsers,
    totalProjects,
    totalSubscriptions,
    allTimeSubscriptions,
    10
  );

  const userPercentage = (totalUsers / max) * 100;
  const projectPercentage = (totalProjects / max) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
        System Overview
      </h3>

      <div className="space-y-6">
        {/* Users Bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Users
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {totalUsers}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${userPercentage}%` }}
            />
          </div>
        </div>

        {/* Projects Bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Projects
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {totalProjects}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${projectPercentage}%` }}
            />
          </div>
        </div>

        {/* Active Subscriptions Bar */}
        <div className="space-y-2">
          <div className="flex items-end justify-between text-xs text-gray-400">
            <span>Active Subscriptions</span>
            <span className="font-bold text-rose-500">
              {totalSubscriptions}
            </span>
          </div>
          <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden group">
            <div
              style={{
                width: `${(totalSubscriptions / max) * 100}%`,
              }}
              className="h-full bg-rose-500 rounded-full relative transition-all duration-1000 ease-out"
            />
          </div>
        </div>

        {/* All Time Subscriptions Bar */}
        <div className="space-y-2">
          <div className="flex items-end justify-between text-xs text-gray-400">
            <span>Total Sales (All Time)</span>
            <span className="font-bold text-emerald-500">
              {allTimeSubscriptions}
            </span>
          </div>
          <div className="relative w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden group">
            <div
              style={{
                width: `${(allTimeSubscriptions / max) * 100}%`,
              }}
              className="h-full bg-emerald-500 rounded-full relative transition-all duration-1000 ease-out"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
