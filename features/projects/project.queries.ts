import { createClient } from "@/lib/supabase/server";
import { Project } from "./project.types";

export async function getProjects(categoryId?: string): Promise<Project[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("projects")
    .select("*, categories(name, color)")
    .eq("user_id", user.id);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query.order("created_at", { ascending: false });

  return data || [];
}

export async function getUserProjectCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching project count:", error);
    return 0;
  }

  return count || 0;
}
