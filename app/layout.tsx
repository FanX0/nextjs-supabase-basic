import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Next.js Supabase Basic",
  description: "Next.js Supabase Basic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("antialiased min-h-screen bg-background font-sans")}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
