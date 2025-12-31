import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

import { resend } from "@/lib/resend";
import SubscriptionSuccessEmail from "@/components/emails/SubscriptionSuccessEmail";
import InvoiceEmail from "@/components/emails/InvoiceEmail";

import { StripeSubscription } from "@/types/stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook Verification Error:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as Stripe.Checkout.Session;

      // Handle Subscription or One-Time Payment (Lifetime)
      let subscriptionId: string;
      let status: string;
      let current_period_end: string;
      let customerId: string;

      // Determine Subscription Details based on Mode
      if (session.mode === "subscription") {
        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription as string
        )) as unknown as StripeSubscription;
        subscriptionId = subscription.id;
        status = subscription.status;
        customerId = subscription.customer as string;
        // Validating subscription data
        if (!subscription || !subscription.current_period_end) {
          console.warn(
            "Subscription data missing current_period_end, defaulting to 30 days."
          );
          current_period_end = new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 30
          ).toISOString();
        } else {
          current_period_end = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        }
      } else if (session.mode === "payment") {
        // Lifetime Deal
        subscriptionId = `lifetime_${session.id}`; // Fake ID for internal use
        status = "active";
        customerId = session.customer as string;
        // Set end date to 100 years from now
        current_period_end = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 365 * 100
        ).toISOString();

        // CRITICAL: Cancel any existing subscription to avoid double billing
        if (session.metadata?.userId) {
          const { data: existingSub } = await adminClient
            .from("subscriptions")
            .select("stripe_subscription_id")
            .eq("user_id", session.metadata.userId)
            .neq(
              "price_id",
              process.env.NEXT_PUBLIC_STRIPE_PRO_LIFETIME_PRICE_ID!
            ) // Don't cancel if somehow it's valid
            .eq("status", "active")
            .maybeSingle();

          if (
            existingSub &&
            existingSub.stripe_subscription_id &&
            existingSub.stripe_subscription_id.startsWith("sub_")
          ) {
            console.log(
              `Cancelling old subscription ${existingSub.stripe_subscription_id} due to Lifetime upgrade.`
            );
            try {
              await stripe.subscriptions.cancel(
                existingSub.stripe_subscription_id
              );
            } catch (err) {
              console.error(
                "Failed to cancel old subscription during lifetime upgrade",
                err
              );
            }
          }
        }
      } else {
        // Unknown mode
        return new NextResponse("Unknown session mode", { status: 400 });
      }

      // Update the local database
      if (!session.metadata?.userId) {
        return new NextResponse("User ID is missing in webhook metadata", {
          status: 400,
        });
      }

      // Send Welcome Email
      if (session.customer_details?.email) {
        await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: [session.customer_details.email],
          subject: "Welcome to Pro Plan! 🚀",
          react: SubscriptionSuccessEmail({
            userEmail: session.customer_details.email,
            planName: "Pro Plan",
            price: "$19/month",
          }),
        });
      }

      const { error } = await adminClient.from("subscriptions").insert({
        user_id: session.metadata.userId,
        // @ts-ignore - We are handling the mismatch or custom column manually
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        // @ts-ignore
        price_id: session.metadata?.priceId || "unknown", // Use metadata or line items
        status: status,
        current_period_end: current_period_end,
      });

      if (error) {
        console.error("Error creating subscription:", error);
        return new NextResponse(`Database Error: ${error.message}`, {
          status: 500,
        });
      }
    } catch (err: any) {
      console.error("Checkout logic failed:", err);
      return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
    }
  }

  // Handle invoice payment succeeded (renewals)
  if (event.type === "invoice.payment_succeeded") {
    try {
      const invoice = event.data.object as Stripe.Invoice;

      // @ts-ignore
      if (!invoice.subscription) {
        // Not a subscription invoice (maybe one-time payment?), ignore
        return new NextResponse(null, { status: 200 });
      }

      // Retrieve the subscription details from Stripe
      const subscription = (await stripe.subscriptions.retrieve(
        // @ts-ignore
        invoice.subscription as string
      )) as unknown as StripeSubscription;

      // Update the period end date and price_id
      const { error } = await adminClient
        .from("subscriptions")
        .update({
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error updating subscription:", error);
        return new NextResponse(`Database Error: ${error.message}`, {
          status: 500,
        });
      }

      // Send Invoice Email
      if (invoice.customer_email) {
        await resend.emails.send({
          from: "SaaS Starter <billing@resend.dev>",
          to: [invoice.customer_email],
          subject: `Invoice ${invoice.number} Paid`,
          react: InvoiceEmail({
            userEmail: invoice.customer_email,
            invoiceId: invoice.number as string,
            invoiceUrl: invoice.hosted_invoice_url as string,
            amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
            date: new Date(invoice.created * 1000).toLocaleDateString(),
          }),
        });
      }
    } catch (err: any) {
      console.error("Invoice logic failed:", err);
      return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
    }
  }

  // Handle subscription deletions or cancellations
  if (event.type === "customer.subscription.deleted") {
    try {
      const subscription = event.data.object as Stripe.Subscription;

      const { error } = await adminClient
        .from("subscriptions")
        .update({
          status: subscription.status,
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error cancelling subscription:", error);
        return new NextResponse(`Database Error: ${error.message}`, {
          status: 500,
        });
      }
    } catch (err: any) {
      console.error("Deletion logic failed:", err);
      return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
    }
  }

  // Handle subscription updates (e.g. upgrades/downgrades via Portal)
  if (event.type === "customer.subscription.updated") {
    try {
      const eventSubscription = event.data.object as Stripe.Subscription;

      // Fetch fresh data to ensure we have the latest status/period
      const subscription = (await stripe.subscriptions.retrieve(
        eventSubscription.id
      )) as unknown as StripeSubscription;

      const { error } = await adminClient
        .from("subscriptions")
        .update({
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id,
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error("Error updating subscription:", error);
        return new NextResponse(`Database Error: ${error.message}`, {
          status: 500,
        });
      }
    } catch (err: any) {
      console.error("Update logic failed:", err);
      return new NextResponse(`Server Error: ${err.message}`, { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
