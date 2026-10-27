import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
};

// Augment the webpack config to externalize Node built-ins required by the
// `postgres` client (v3). The built-in modules (net, tls, crypto, stream,
// perf_hooks) cannot be resolved by webpack's bundler so they must be
// externalized; Node.js provides polyfills at runtime.
nextConfig.webpack = (config) => {
  // Next.js may already have an `externals` array from `serverExternalPackages`.
  // Merge the Node built-ins into it without destroying the existing array.
  const existing = config.externals;
  if (Array.isArray(existing)) {
    config.externals = [
      ...existing,
      "net",
      "tls",
      "crypto",
      "stream",
      "perf_hooks",
    ];
  } else if (existing && typeof existing === "object") {
    (config.externals as Record<string, string>) = {
      ...existing,
      net: "require('net')",
      tls: "require('tls')",
      crypto: "require('crypto')",
      stream: "require('stream')",
      perf_hooks: "require('perf_hooks')",
    };
  } else {
    config.externals = {
      net: "require('net')",
      tls: "require('tls')",
      crypto: "require('crypto')",
      stream: "require('stream')",
      perf_hooks: "require('perf_hooks')",
    };
  }
  return config;
};

export default nextConfig;
