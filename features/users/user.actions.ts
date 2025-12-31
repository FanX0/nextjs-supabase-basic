"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, UpdateProfileInput } from "./user.schema";

export async function updateProfile(data: UpdateProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const result = updateProfileSchema.safeParse(data);

  if (!result.success) {
    throw new Error("Invalid input data");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: result.data.full_name,
      avatar_url: result.data.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/user");
  return { success: true };
}
