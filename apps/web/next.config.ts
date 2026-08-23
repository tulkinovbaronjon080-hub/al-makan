import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // packages/* ship TS source, not prebuilt output — Next transpiles them.
  transpilePackages: ["@al-makan/ui", "@al-makan/types", "@al-makan/calculation-engine"],
};

export default nextConfig;
