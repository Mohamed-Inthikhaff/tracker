import type { ReactNode } from "react";
import "@expense-tracker/ui/theme/tokens.css";
import "@/styles/globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata = {
  title: "Expense Tracker",
  description: "Household expense tracking SaaS",
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
