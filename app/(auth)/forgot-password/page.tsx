"use client";

import { useState, Suspense } from "react";
import { resetPasswordForEmail } from "@/features/auth/auth.actions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const success = searchParams.get("success");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    const email = formData.get("email") as string;
    await resetPasswordForEmail(email);
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        Reset Password
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm text-center">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center">
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">
            {success}
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            You can close this tab and check your email.
          </p>
          <Link
            href="/login"
            className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
          >
            Return to Login
          </Link>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-transparent dark:text-white border"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send Reset Link"}
          </button>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
            >
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full max-w-md h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
