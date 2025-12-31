"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createProjectSchema,
  CreateProjectInput,
  updateProjectSchema,
  UpdateProjectInput,
} from "./project.schema";

import { resend } from "@/lib/resend";
import ProjectCreatedEmail from "@/components/emails/ProjectCreatedEmail";

export async function createProject(data: CreateProjectInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const result = createProjectSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid input data");
  }

  // 1. Check Project Limits (Pro Feature)
  // Get active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .in("status", ["trialing", "active"])
    .eq("user_id", user.id)
    .maybeSingle();

  // Check for Admin Role and get details
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  const isPro = !!subscription || isAdmin;

  // Get current project count
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const MAX_FREE_PROJECTS = 2;

  if (!isPro && (projectCount || 0) >= MAX_FREE_PROJECTS) {
    throw new Error(
      "Free Plan Limit Reached: You can only create 2 projects. Upgrade to Pro for unlimited projects."
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: result.data.name,
      description: result.data.description,
      image_url: result.data.image_url,
      category_id: result.data.category_id,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Send Email Calculation (Fire and forget, don't block response)
  const userFirstname = profile?.full_name?.split(" ")[0] || "there";

  try {
    await resend.emails.send({
      from: "SaaS Starter <onboarding@resend.dev>", // Default testing domain
      to: user.email!,
      subject: "Project Created! 🚀",
      react: ProjectCreatedEmail({
        userFirstname,
        projectName: project.name,
        projectId: project.id,
      }),
    });
  } catch (emailError) {
    console.error("Failed to send email:", emailError);
  }

  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects");
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/admin/users");
}

export async function updateProject(
  projectId: string,
  data: UpdateProjectInput
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const result = updateProjectSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid input data");
  }

  // Verify ownership or admin status (RLS handles this, but good to check or handle RLS error)
  const { error } = await supabase
    .from("projects")
    .update({
      name: result.data.name,
      description: result.data.description,
      image_url: result.data.image_url,
      category_id: result.data.category_id,
    })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}
