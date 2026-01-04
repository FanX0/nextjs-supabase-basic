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

export async function createProject(
  data: CreateProjectInput,
  ownerId?: string
) {
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

  // Check for Admin Role and get details
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  // Determine target user ID
  const targetUserId = ownerId && isAdmin ? ownerId : user.id;

  // 1. Check Project Limits (Pro Feature) - Check for TARGET user
  // Get active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .in("status", ["trialing", "active"])
    .eq("user_id", targetUserId)
    .maybeSingle();

  // "isPro" applies if the TARGET user has a sub OR if the ACTOR is an admin (Admins bypass limits for themselves, but maybe not when creating for free users? Actually admins should be able to create unlimited projects for anyone).
  // Let's say Admins bypass limits always.
  const isPro = !!subscription || isAdmin;

  // Get current project count for TARGET user
  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", targetUserId);

  const MAX_FREE_PROJECTS = 2;

  if (!isPro && (projectCount || 0) >= MAX_FREE_PROJECTS) {
    throw new Error(
      "Free Plan Limit Reached: User can only create 2 projects."
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: result.data.name,
      description: result.data.description,
      image_url: result.data.image_url,
      category_id: result.data.category_id,
      user_id: targetUserId,
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
