import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We&apos;ve sent a verification link to your email address. Please
            check your inbox (and spam folder) to verify your account.
          </p>
        </div>
        <div className="mt-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Once verified, you can sign in to your account.
          </p>
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            &larr; Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
