"use client";

import Link from "next/link";
import { Project } from "@/features/projects/project.types";
import { useProjectsRealtime } from "@/features/projects/useProjectsRealtime";

interface DashboardProjectListProps {
  initialProjects: Project[];
}

export function DashboardProjectList({
  initialProjects,
}: DashboardProjectListProps) {
  // Use the realtime hook, filtering for user handled by server initial fetch + router.refresh()
  const projects = useProjectsRealtime(initialProjects, true);

  if (projects.length === 0) {
    return (
      <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          No projects
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new project.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/projects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition"
        >
          <div className="relative h-40 w-full mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            {project.image_url ? (
              <img
                src={project.image_url}
                alt={project.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <span className="text-3xl">🖼️</span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {project.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 line-clamp-2 h-12 mb-4">
            {project.description || "No description"}
          </p>
          <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-xs text-gray-500">
              {new Date(project.created_at).toLocaleDateString()}
            </div>
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View &rarr;
            </Link>
          </div>
        </div>
      ))}
    </>
  );
}
