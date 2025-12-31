"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Variation {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  price?: number;
  created_at: string;
}

export async function getVariations(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_variations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching variations:", error);
    return [];
  }

  return data as Variation[];
}

export async function createVariation(data: {
  project_id: string;
  name: string;
  description?: string;
  price?: number;
}) {
  const supabase = await createClient();

  // RLS will enforce ownership check
  const { error } = await supabase.from("project_variations").insert({
    project_id: data.project_id,
    name: data.name,
    description: data.description,
    price: data.price,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${data.project_id}`);
}

export async function deleteVariation(variationId: string, projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_variations")
    .delete()
    .eq("id", variationId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}
