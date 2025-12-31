"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole } from "@/features/auth/auth.types";

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient();

  // 1. Check if current user is admin
  // (We do this check on the server for security, though RLS backs it up)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized: only admins can update roles");
  }

  // 1.1 Hierarchy Check
  // Admin cannot promote to Admin or Super Admin
  if (
    currentUserProfile.role === "admin" &&
    (newRole === "admin" || newRole === "super_admin")
  ) {
    throw new Error("Unauthorized: Admins cannot promote to Admin/Super Admin");
  }

  // Admin cannot modify another Admin or Super Admin
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (currentUserProfile.role === "admin") {
    // Cannot touch Super Admin
    if (targetProfile?.role === "super_admin") {
      throw new Error("Unauthorized: Admins cannot modify Super Admins");
    }
    // Cannot touch OTHER Admins (Self is okay, though usually handled via settings)
    if (targetProfile?.role === "admin" && userId !== user.id) {
      throw new Error("Unauthorized: Admins cannot modify other Admins");
    }
  }

  // 2. Update the target user's role
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/users");
}

export async function inviteUser(email: string, role: UserRole) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  // 1.1 Hierarchy Check for Invite
  if (currentUserProfile.role === "admin") {
    if (role === "admin" || role === "super_admin") {
      throw new Error("Unauthorized: Admins cannot invite Admins/Super Admins");
    }
  }

  // 2. Invite User (sends magic link)
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: { role }, // Sets metadata, trigger copies to profiles table
    }
  );

  if (error) throw new Error(error.message);

  // 3. Ensure Role is set in Profiles (double check)
  // The trigger should handle this, but we want to be explicit to avoid race conditions or trigger failures
  if (data.user) {
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);

    if (profileError) {
      console.error("Failed to update profile role:", profileError);
      // We don't throw here to avoid failing the whole invite if just the role sync failed,
      // but ideally we should let the admin know.
    }
  }

  revalidatePath("/dashboard/admin/users");
  return data;
}

export async function adminUpdateUser(
  targetUserId: string,
  data: { email?: string; password?: string; fullName?: string }
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .single();

  // Hierarchy Check
  if (currentUserProfile.role === "admin") {
    if (targetProfile?.role === "super_admin") {
      throw new Error("Admins cannot update Super Admins");
    }
    if (targetProfile?.role === "admin" && targetUserId !== user.id) {
      throw new Error("Admins cannot update other Admins");
    }
  }

  // 2. Update Auth (Email/Password)
  if (data.email || data.password) {
    const { error } = await adminClient.auth.admin.updateUserById(
      targetUserId,
      {
        email: data.email,
        password: data.password,
        user_metadata: data.fullName ? { full_name: data.fullName } : undefined,
      }
    );
    if (error) throw new Error(error.message);
  }

  // 3. Update Profile (Name)
  if (data.fullName) {
    const { error } = await adminClient
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", targetUserId);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${targetUserId}`);
}

export async function adminDeleteUser(targetUserId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .single();

  // Hierarchy Check
  if (currentUserProfile.role === "admin") {
    if (targetProfile?.role === "super_admin") {
      throw new Error("Admins cannot delete Super Admins");
    }
    if (targetProfile?.role === "admin" && targetUserId !== user.id) {
      throw new Error("Admins cannot delete other Admins");
    }
  }

  // 2. Delete User Data (Manual Cascade to handle missing DB constraints)
  // Delete subscriptions first (as it might not have cascade set up)
  await adminClient.from("subscriptions").delete().eq("user_id", targetUserId);

  // Delete projects (good practice to ensure clean up)
  await adminClient.from("projects").delete().eq("user_id", targetUserId);

  // 3. Delete User (Auth + DB Cascade)
  const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admin/users");
}

export async function getSystemStats() {
  const supabase = await createClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  // 2. Fetch Stats
  // Use adminClient to bypass RLS for stats counting
  const adminClient = createAdminClient();

  // Using head: true to only fetch the count, not the data
  const { count: usersCount, error: usersError } = await adminClient
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: projectsCount, error: projectsError } = await adminClient
    .from("projects")
    .select("*", { count: "exact", head: true });

  // Count active or trialing subscriptions
  const { count: subscriptionsCount, error: subscriptionsError } =
    await adminClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "trialing"]);

  // Count ALL subscriptions (History of all sales)
  const { count: allTimeSubscriptionsCount, error: allTimeError } =
    await adminClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true });

  if (usersError || projectsError || subscriptionsError || allTimeError) {
    throw new Error("Failed to fetch stats");
  }

  return {
    totalUsers: usersCount || 0,
    totalProjects: projectsCount || 0,
    totalSubscriptions: subscriptionsCount || 0,
    allTimeSubscriptions: allTimeSubscriptionsCount || 0,
  };
}

export async function adminUpdateSubscription(
  targetUserId: string,
  planType: "free" | "monthly" | "yearly" | "lifetime",
  customEndDate?: string // ISO Date String
) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  // 2. Handle Plan Logic
  if (planType === "free") {
    // Cancel/Delete subscription
    const { error } = await adminClient
      .from("subscriptions")
      .delete()
      .eq("user_id", targetUserId);

    if (error) throw new Error(error.message);
  } else {
    // Create/Update Subscription
    let priceId = "";

    // Check for existing active subscription
    const { data: existingSub } = await adminClient
      .from("subscriptions")
      .select("id, current_period_end")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Determine Period End
    let periodEnd = new Date();

    if (customEndDate) {
      // Use the provided custom date
      periodEnd = new Date(customEndDate);
    } else {
      // Default Logic: Start from existing end date if valid and in future, else now
      if (
        existingSub &&
        existingSub.current_period_end &&
        new Date(existingSub.current_period_end) > new Date()
      ) {
        periodEnd = new Date(existingSub.current_period_end);
      }

      if (planType === "monthly") {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (planType === "yearly") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else if (planType === "lifetime") {
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      }
    }

    // Set Price ID based on Plan Type (even if custom date is used, we need a price ID reference)
    if (planType === "monthly") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
    } else if (planType === "yearly") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!;
    } else if (planType === "lifetime") {
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_LIFETIME_PRICE_ID!;
    }

    if (!priceId) {
      throw new Error(`Price ID for ${planType} is not configured in env.`);
    }

    // Upsert subscription
    // We use a fake stripe ID to indicate manual override
    const fakeSubscriptionId = `manual_${user.id}_${Date.now()}`;

    const subscriptionData = {
      user_id: targetUserId,
      status: "active",
      price_id: priceId,
      current_period_end: periodEnd.toISOString(),
      metadata: { updated_by: user.id, type: "admin_override" },
      stripe_subscription_id: existingSub ? undefined : fakeSubscriptionId, // Keep existing ID if updating, else new
    };

    if (existingSub) {
      const { error } = await adminClient
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await adminClient
        .from("subscriptions")
        .insert(subscriptionData);
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${targetUserId}`);
}

export async function getSubscriptionDetails(targetUserId: string) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Check Permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    currentUserProfile?.role !== "admin" &&
    currentUserProfile?.role !== "super_admin"
  ) {
    throw new Error("Unauthorized");
  }

  // 2. Fetch Subscription (Admin Client bypasses RLS)
  const { data: userSub } = await adminClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", targetUserId)
    .in("status", ["active", "trialing"])
    .order("created", { ascending: false })
    .limit(1)
    .maybeSingle();

  return userSub;
}
