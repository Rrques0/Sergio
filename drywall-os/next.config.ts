import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb"
    }
  },
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json"
  }
};

export default withNextIntl(nextConfig);
