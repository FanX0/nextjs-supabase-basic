"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- Types ---
export interface Category {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

// --- Helpers ---
async function checkAdminPermissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Unauthorized: Only Admins can manage categories.");
  }

  return supabase;
}

// --- Actions ---

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data as Category[];
}

export async function createCategory(data: { name: string; color?: string }) {
  const supabase = await checkAdminPermissions(); // Ensure Admin

  const { error } = await supabase.from("categories").insert({
    name: data.name,
    color: data.color,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects"); // Revalidate where projects are created
  revalidatePath("/dashboard/admin/categories");
}

export async function updateCategory(
  id: string,
  data: { name: string; color?: string }
) {
  const supabase = await checkAdminPermissions(); // Ensure Admin

  const { error } = await supabase
    .from("categories")
    .update({
      name: data.name,
      color: data.color,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/admin/categories");
}

export async function deleteCategory(id: string) {
  const supabase = await checkAdminPermissions(); // Ensure Admin

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/admin/categories");
}
