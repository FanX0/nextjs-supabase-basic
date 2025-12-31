"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project } from "./project.types";
import { useRouter } from "next/navigation";

export function useProjectsRealtime(
  initialProjects: Project[],
  filterByUser: boolean = false
) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Sync state with initial props if they change (e.g. strict mode or revalidation)
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    const channel = supabase
      .channel("projects_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        async (payload) => {
          console.log("Realtime change received:", payload);

          // Strategy: For simplicity and correctness with filters,
          // we can invalidate the server data so the parent passes new props.
          router.refresh();

          // Optimistic updates (optional but smoother):
          if (payload.eventType === "INSERT") {
            const newProject = payload.new as Project;
            // If filtering by user, we need to check if it belongs to current user.
            // But we don't have current user ID here easily to check "payload.new.user_id === me".
            // For public feed, just add it.
            // For dashboard, refreshing is safer.
            if (!filterByUser) {
              setProjects((prev) => [newProject, ...prev]);
            }
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            const updatedProject = payload.new as Project;
            setProjects((prev) =>
              prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, filterByUser]);

  return projects;
}
