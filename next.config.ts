import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix monorepo/workspace-root inference when parent directories contain other lockfiles.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
