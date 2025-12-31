import Stripe from "stripe";

export type StripeSubscription = Stripe.Subscription & {
  current_period_end: number;
};
