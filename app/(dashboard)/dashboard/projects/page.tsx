import Link from "next/link";
import { getProjects } from "@/features/projects/project.queries";
import { DashboardProjectList } from "@/components/projects/DashboardProjectList";
import { getSubscription } from "@/features/billing/subscription.queries";
import { getCategories } from "@/features/categories/categories.actions";
import { ProjectCategoryFilter } from "@/components/projects/ProjectCategoryFilter";
import { Project } from "@/features/projects/project.types";

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function ProjectsPage({ searchParams }: Props) {
  const categoryId =
    typeof searchParams.category === "string"
      ? searchParams.category
      : undefined;

  const [projects, categories, subscription] = await Promise.all([
    getProjects(categoryId),
    getCategories(),
    getSubscription(),
  ]);

  const isPro = !!subscription;
  const isLimitReached = !isPro && projects.length >= 2;

  // Group projects by category
  const groupedProjects: { [key: string]: Project[] } = {};
  const uncategorizedProjects: Project[] = [];

  // Create a map for easy category lookup by ID (to get name/color even if filtering)
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex items-center gap-4">
          <ProjectCategoryFilter categories={categories} />
          {isLimitReached ? (
            <Link
              href="/pricing"
              className="bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded transition flex items-center shadow-md"
            >
              <span className="mr-2">🚀</span> Upgrade to Create
            </Link>
          ) : (
            <Link
              href="/dashboard/projects/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition"
            >
              New Project
            </Link>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
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
      ) : (
        <div className="space-y-12">
          {/* Render Categories Sections */}
          {categories.map((category) => {
            const categoryProjects = groupedProjects[category.id];
            // If filtering, we might only show one category, but this map iterates all.
            // Just check if we have projects for this category.
            if (!categoryProjects || categoryProjects.length === 0) return null;

            return (
              <section key={category.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color || "#ccc" }}
                  />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                    {category.name}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {categoryProjects.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Render Uncategorized Section */}
          {uncategorizedProjects.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-4 h-4 rounded-full border border-gray-300 bg-gray-100 dark:bg-gray-700" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  Uncategorized
                </h2>
                <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {uncategorizedProjects.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uncategorizedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
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
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {project.name}
        </h2>
      </div>
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
  );
}
