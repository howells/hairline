import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/*
 * The library build: charts (index) and the kit of parts, as ES modules for a
 * React host. React and d3 stay as the host's dependencies; atlas JSON is
 * bundled so the entry also loads in native Node ESM. Every
 * chunk is marked "use client": charts measure, hover and animate, so in a
 * React Server Components host they render on the client.
 */
const external = /^(?:react|react-dom|d3-[\w-]+|topojson-client)(?:\/.*)?$/u;

export default defineConfig({
  build: {
    copyPublicDir: false,
    emptyOutDir: true,
    lib: {
      entry: { index: "src/index.ts", kit: "src/kit.ts" },
      formats: ["es"],
    },
    outDir: "lib",
    rolldownOptions: {
      external: (id) => external.test(id),
      // One module per source file, so a host bundles only the charts it imports.
      output: {
        banner: '"use client";',
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    sourcemap: true,
  },
  plugins: [react()],
});
