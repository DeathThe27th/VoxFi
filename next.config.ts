import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: { useTypeScriptCli: false },
  webpack(config) {
    // Privy probes this optional Farcaster/Solana bridge at runtime. Vox is EVM-only.
    config.resolve.alias["@farcaster/mini-app-solana"] = false;
    return config;
  },
};

export default nextConfig;
