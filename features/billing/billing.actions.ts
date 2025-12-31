"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(priceId: string) {
  console.log("createCheckoutSession received priceId:", priceId);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing via process.env");
  }

  // 1. Get or create customer
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;

    // Save customer ID to profile
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  // 2. Check for existing subscription logic
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, price_id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const isLifetimePrice =
    priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_LIFETIME_PRICE_ID;

  // Logic:
  // - If buying Lifetime: Always Checkout (will handle old sub cancellation in webhook potentially/manually)
  // - If buying Subscription AND already has Active Subscription: Go to Portal to Switch (Standard Proration)
  // - Else: Checkout

  if (
    !isLifetimePrice &&
    existingSub &&
    existingSub.stripe_subscription_id &&
    existingSub.stripe_subscription_id.startsWith("sub_")
  ) {
    console.log(
      "User has active subscription, redirecting to Portal for update"
    );

    // Create Portal Session with Update Flow
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/pricing`,
      flow_data: {
        type: "subscription_update",
        subscription_update: {
          subscription: existingSub.stripe_subscription_id,
        },
      },
    });

    return redirect(session.url);
  }

  // 3. Create Checkout session (New Sub or Lifetime)
  let session;
  try {
    const mode = isLifetimePrice ? "payment" : "subscription";
    console.log(`Creating Stripe Session. Mode: ${mode}, Price: ${priceId}`);

    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/dashboard?success=true`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        priceId: priceId,
        // If it's lifetime, we might want to flag to cancel old subs
        action: isLifetimePrice ? "buy_lifetime" : "new_subscription",
      },
    });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    throw new Error(`Stripe Error: ${error.message}`);
  }

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  redirect(session.url);
}

export async function createCustomerPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error("No billing customer found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  redirect(session.url);
}
