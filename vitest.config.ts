import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      lib: path.resolve(__dirname, "lib"),
      components: path.resolve(__dirname, "components"),
      app: path.resolve(__dirname, "app"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts"],
  },
});
