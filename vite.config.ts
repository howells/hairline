import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        // Vendor code in long-lived chunks that cache across deploys. Routes
        // stay static imports (the lint forbids runtime dynamic imports).
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/u,
            },
            {
              name: "d3",
              test: /node_modules[\\/](?:d3-[\w-]+|internmap|delaunator|robust-predicates)[\\/]/u,
            },
            {
              name: "geo",
              test: /node_modules[\\/](?:world-atlas|us-atlas|topojson-client)[\\/]/u,
            },
          ],
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
