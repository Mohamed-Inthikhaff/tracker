import type { ReactNode } from "react";
import "@expense-tracker/ui/theme/tokens.css";
import "@/styles/globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata = {
  title: "Quick capture · Expense Tracker",
  description: "Mobile-first two-tap transaction capture",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default" as const,
    title: "Capture",
  },
};

export const viewport = {
  themeColor: "#1f3a5f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
