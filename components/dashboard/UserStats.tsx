"use client";

interface UserStatsProps {
  totalProjects: number;
  subscription: any | null; // typing as any to avoid strict type dependency here, or import type
}

export function UserStats({ totalProjects, subscription }: UserStatsProps) {
  const isPro = !!subscription;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center justify-between">
        <span>Activity Overview</span>
        {isPro && (
          <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded dark:bg-indigo-900 dark:text-indigo-300">
            PRO
          </span>
        )}
      </h3>
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Current Plan
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {isPro ? "Pro Plan" : "Free Plan"}
          </span>
        </div>
        {isPro && subscription?.current_period_end && (
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-sm font-medium ${
                subscription.cancel_at_period_end
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {subscription.cancel_at_period_end ? "Expires on" : "Renews on"}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {new Date(subscription.current_period_end).toLocaleDateString(
                undefined,
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center mb-2 mt-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Projects
          </span>
          {isPro ? (
            <span className="text-2xl font-bold text-indigo-600">
              {totalProjects}
            </span>
          ) : (
            <div className="flex items-center space-x-2 text-gray-400">
              <span className="text-sm font-medium">Locked</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                Pro
              </span>
            </div>
          )}
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          {/* Visual indicator: Only show progress for Pro users */}
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
              isPro ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
            }`}
            style={{ width: isPro && totalProjects > 0 ? "100%" : "30%" }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {totalProjects === 0
            ? "Create your first project to verify activity!"
            : "You are an active contributor."}
        </p>
      </div>
    </div>
  );
}
