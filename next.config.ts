import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix monorepo/workspace-root inference when parent directories contain other lockfiles.
  outputFileTracingRoot: path.join(__dirname),
  // Ensure kuromoji dictionary files are included in server output tracing (needed for kuroshiro).
  outputFileTracingIncludes: {
    "/*": ["./node_modules/kuromoji/dict/**"],
  },
};

export default nextConfig;
