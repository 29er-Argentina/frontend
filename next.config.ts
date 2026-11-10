import type { NextConfig } from "next";

// En GitHub Pages el sitio vive en una subcarpeta (/frontend); el workflow la pasa por acá.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath ? { basePath } : {}),
  reactStrictMode: true,
  agentRules: false,
};

export default nextConfig;
