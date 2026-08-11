import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@expense-tracker/ui",
    "@expense-tracker/types",
    "@expense-tracker/utils",
  ],
};

export default nextConfig;
