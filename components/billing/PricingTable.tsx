"use client";

import { createCheckoutSession } from "@/features/billing/billing.actions";
import { Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingTableProps {
  subscription?: any | null;
}

export function PricingTable({ subscription }: PricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );
  const router = useRouter();

  // Price IDs
  const PRO_MONTHLY_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
  const PRO_YEARLY_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID!;
  const PRO_LIFETIME_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_LIFETIME_PRICE_ID!;

  console.log("Price IDs:", {
    PRO_MONTHLY_ID,
    PRO_YEARLY_ID,
    PRO_LIFETIME_ID,
  });

  const isPro = !!subscription;

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) {
      alert(
        "Error: Stripe Price ID is missing. Please check your .env.local configuration."
      );
      return;
    }
    setLoading(priceId);
    try {
      await createCheckoutSession(priceId);
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT") {
        // Redirecting, do nothing
        return;
      }
      console.error(error);
      alert(`Checkout Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-center mb-8 col-span-full">
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
          <button
            onClick={() => setBillingInterval("month")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingInterval === "month"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("year")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingInterval === "year"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Yearly <span className="text-green-500 text-xs ml-1">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 w-full">
        {/* Free Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Free
          </h3>
          <p className="text-gray-500 mt-2">Perfect for side projects.</p>
          <div className="my-6">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
              $0
            </span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-green-500 mr-2" /> 2 Projects
            </li>
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-green-500 mr-2" /> Basic Analytics
            </li>
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-green-500 mr-2" /> Community
              Support
            </li>
          </ul>
          <button
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            disabled
          >
            {!isPro ? "Current Plan" : "Downgrade (Contact Support)"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-indigo-600 relative p-8 flex flex-col transform scale-105 z-10">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Popular
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Pro
          </h3>
          <p className="text-gray-500 mt-2">For serious developers.</p>
          <div className="my-6">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
              {billingInterval === "year" ? "$15" : "$19"}
            </span>
            <span className="text-gray-500">/month</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-indigo-500 mr-2" /> Unlimited
              Projects
            </li>
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-indigo-500 mr-2" /> Advanced
              Analytics
            </li>
            <li className="flex items-center text-gray-600 dark:text-gray-300">
              <Check className="w-5 h-5 text-indigo-500 mr-2" /> Priority
              Support
            </li>
          </ul>
          <button
            onClick={() =>
              handleUpgrade(
                billingInterval === "year" ? PRO_YEARLY_ID : PRO_MONTHLY_ID
              )
            }
            disabled={
              !!loading ||
              subscription?.price_id ===
                (billingInterval === "year" ? PRO_YEARLY_ID : PRO_MONTHLY_ID)
            }
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ===
            (billingInterval === "year" ? PRO_YEARLY_ID : PRO_MONTHLY_ID) ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : subscription?.price_id ===
              (billingInterval === "year" ? PRO_YEARLY_ID : PRO_MONTHLY_ID) ? (
              "Current Plan"
            ) : isPro ? (
              billingInterval === "year" ? (
                "Upgrade to Yearly (Save 56%)"
              ) : (
                "Switch to Monthly"
              )
            ) : (
              `Subscribe ${billingInterval === "year" ? "Yearly" : "Monthly"}`
            )}
          </button>
        </div>

        {/* Lifetime Plan */}
        <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 flex flex-col relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition duration-500" />
          <h3 className="text-xl font-bold text-white">Lifetime</h3>
          <p className="text-gray-400 mt-2">Pay once, own it forever.</p>
          <div className="my-6">
            <span className="text-4xl font-extrabold text-white">$299</span>
            <span className="text-gray-400">/one-time</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center text-gray-300">
              <Check className="w-5 h-5 text-purple-400 mr-2" /> Everything in
              Pro
            </li>
            <li className="flex items-center text-gray-300">
              <Check className="w-5 h-5 text-purple-400 mr-2" /> No Monthly Fees
            </li>
            <li className="flex items-center text-gray-300">
              <Check className="w-5 h-5 text-purple-400 mr-2" /> Future Updates
              Included
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade(PRO_LIFETIME_ID)}
            disabled={!!loading || subscription?.price_id === PRO_LIFETIME_ID}
            className="w-full py-2 px-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center relative z-10"
          >
            {loading === PRO_LIFETIME_ID ? (
              <span className="w-5 h-5 border-2 border-gray-900/20 border-t-gray-900 rounded-full animate-spin" />
            ) : subscription?.price_id === PRO_LIFETIME_ID ? (
              "Current Plan"
            ) : (
              "Get Lifetime Access"
            )}
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-4xl mx-auto w-full px-4">
        <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h3>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              ✨ How does switching plans work?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We use <strong>smart proration</strong>. If you upgrade from
              Monthly to Yearly halfway through the month, the unused value of
              your monthly subscription is automatically applied as a credit to
              your new Yearly bill. You never lose money.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔒 Is the Lifetime Deal really forever?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Yes! You pay once and get access to all Pro features forever,
              including future updates. No recurring fees, ever. It's our way of
              rewarding early supporters.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              💳 Can I cancel my subscription?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Absolutely. You can cancel anytime from your dashboard. Your
              access will remain active until the end of your current billing
              period.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              🧾 Do you offer corporate invoices?
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Yes. After any payment, you will receive a standard invoice via
              email which you can download for your accounting records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
