import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Fija la raíz de tracing a esta carpeta (hay varios lockfiles en el árbol).
  outputFileTracingRoot: root,
};

export default nextConfig;
