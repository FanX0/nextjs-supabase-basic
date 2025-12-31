import { createClient } from "@/lib/supabase/server";

export async function getSubscription() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check for Admin status first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin" || profile?.role === "super_admin") {
    // Return a mock active subscription for admins
    return {
      status: "active",
      current_period_end: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365 * 10
      ).toISOString(), // 10 years
      plan: {
        nickname: "Admin Lifetime Pro",
      },
    } as any;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .in("status", ["trialing", "active"])
    .eq("user_id", user.id)
    .maybeSingle();

  return subscription;
}
