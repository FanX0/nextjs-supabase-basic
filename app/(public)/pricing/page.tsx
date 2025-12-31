import { PricingTable } from "@/components/billing/PricingTable";
import { Navbar } from "@/components/layout/Navbar";

import { getSubscription } from "@/features/billing/subscription.queries";

export default async function PricingPage() {
  const subscription = await getSubscription();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="text-center mb-16 px-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </div>
        <PricingTable subscription={subscription} />
      </div>
    </div>
  );
}
