"use client";

import { useEffect, useState } from "react";
import {
  getPublicProjects,
  getPublicCategories,
  ProjectWithAuthor,
} from "@/features/projects/public.queries";
import Link from "next/link";

import { useProjectsRealtime } from "@/features/projects/useProjectsRealtime";

export default function PublicProjectsPage() {
  const [initialProjects, setInitialProjects] = useState<ProjectWithAuthor[]>(
    []
  );
  const [categories, setCategories] = useState<any[]>([]);

  // Use "any" cast temporarily because hook expects Project[] but we have extended type.
  // The hook logic is generic enough for ID updates.
  const projects = useProjectsRealtime(
    initialProjects as any,
    false
  ) as ProjectWithAuthor[];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublicProjects(), getPublicCategories()]).then(
      ([projectsData, categoriesData]) => {
        setInitialProjects(projectsData);
        setCategories(categoriesData);
        setLoading(false);
      }
    );
  }, []);

  // Group projects logic
  const groupedProjects: { [key: string]: ProjectWithAuthor[] } = {};
  const uncategorizedProjects: ProjectWithAuthor[] = [];

  projects.forEach((project) => {
    if (project.category_id) {
      if (!groupedProjects[project.category_id]) {
        groupedProjects[project.category_id] = [];
      }
      groupedProjects[project.category_id].push(project);
    } else {
      uncategorizedProjects.push(project);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
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
          <div className="space-y-16">
            {projects.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                No projects found yet. Be the first to create one!
              </div>
            )}

            {/* Render Categories Sections */}
            {categories.map((category) => {
              const categoryProjects = groupedProjects[category.id];
              if (!categoryProjects || categoryProjects.length === 0)
                return null;

              return (
                <section key={category.id}>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: category.color || "#ccc" }}
                    />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {category.name}
                    </h2>
                    <span className="text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                      {categoryProjects.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryProjects.map((project) => (
                      <PublicProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Render Uncategorized Section */}
            {uncategorizedProjects.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 dark:bg-gray-700" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Uncategorized
                  </h2>
                  <span className="text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                    {uncategorizedProjects.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {uncategorizedProjects.map((project) => (
                    <PublicProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PublicProjectCard({ project }: { project: ProjectWithAuthor }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition duration-300 flex flex-col h-full border border-gray-100 dark:border-gray-700">
      <div className="relative h-48 w-full mb-4 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
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
      <div className="flex-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {project.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm">
          {project.description || "No description provided."}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center">
          <div className="shrink-0">
            {project.profiles?.avatar_url ? (
              <img
                src={project.profiles.avatar_url}
                alt={project.profiles.full_name || "User"}
                className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <span className="flex h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 items-center justify-center font-bold text-xs">
                {project.profiles?.full_name?.[0] || "U"}
              </span>
            )}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[100px]">
              {project.profiles?.full_name || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
