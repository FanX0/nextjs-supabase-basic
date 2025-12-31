"use client";

import { useEffect, useState } from "react";
import {
  getPublicProjects,
  ProjectWithAuthor,
} from "@/features/projects/public.queries";
import Link from "next/link";

import { useProjectsRealtime } from "@/features/projects/useProjectsRealtime";
import { Project } from "@/features/projects/project.types";

export default function PublicProjectsPage() {
  const [initialProjects, setInitialProjects] = useState<ProjectWithAuthor[]>(
    []
  );
  // Use "any" cast temporarily because hook expects Project[] but we have extended type.
  // The hook logic is generic enough for ID updates.
  const projects = useProjectsRealtime(
    initialProjects as any,
    false
  ) as ProjectWithAuthor[];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProjects().then((data) => {
      setInitialProjects(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Community Projects
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Discover what others are building.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading projects...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition duration-300"
              >
                <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {project.name}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 line-clamp-3">
                  {project.description || "No description provided."}
                </p>
                <div className="mt-4 flex items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex-shrink-0">
                    {project.profiles?.avatar_url ? (
                      <img
                        src={project.profiles.avatar_url}
                        alt={project.profiles.full_name || "User"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-block h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {project.profiles?.full_name?.[0] || "U"}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {project.profiles?.full_name || "Anonymous User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {projects.length === 0 && !loading && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No projects found yet. Be the first to create one!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
