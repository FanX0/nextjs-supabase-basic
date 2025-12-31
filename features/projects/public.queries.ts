import { createClient } from "@/lib/supabase/client";
import { Project } from "./project.types";

export type ProjectWithAuthor = Project & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function getPublicProjects(): Promise<ProjectWithAuthor[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("projects")
    .select("*, profiles(full_name, avatar_url)")
    .order("created_at", { ascending: false });

  return (data as ProjectWithAuthor[]) || [];
}

export async function getPublicCategories() {
  const supabase = createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data || [];
}
