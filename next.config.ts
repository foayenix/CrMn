import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server bundle so Coolify/Docker deploys stay small.
  output: "standalone",
  // The public site reads live data (What's On, bookings) at request time, so
  // nothing here should be statically cached at build. Route-level dynamic
  // rendering is enforced in the pages that need it.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
