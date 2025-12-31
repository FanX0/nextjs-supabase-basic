import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background text-foreground">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Welcome to{" "}
          <span className="text-indigo-600 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            Next.js + Supabase
          </span>
        </h1>

        <p className="mt-3 text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl">
          An industry-standard boilerplate with Authentication, Role-based
          Access, and a Modern Tech Stack.
        </p>

        <div className="flex mt-8 space-x-4">
          <Link
            href="/login"
            className="px-8 py-3 text-white bg-indigo-600 rounded-full font-semibold shadow-lg hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 text-indigo-600 bg-white border-2 border-indigo-600 rounded-full font-semibold shadow-md hover:bg-indigo-50 transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            Register
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 text-gray-600 bg-gray-100 rounded-full font-semibold shadow-md hover:bg-gray-200 transition duration-300 ease-in-out"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-12">
          <Link
            href="/projects"
            className="text-indigo-600 hover:text-indigo-500 font-medium text-lg underline"
          >
            Explore All Projects &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
