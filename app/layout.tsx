import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Habitus",
  description: "Track your habits and build a better you",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Desktop sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
              {children}
            </main>
          </div>

          {/* Mobile bottom nav */}
          <MobileNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
