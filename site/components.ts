import { defineComponents } from "blume";

export default defineComponents({
  mdx: {
    ChartExample: {
      client: "load",
      component: "./components/chart-example.tsx",
    },
    Props: "./components/props.astro",
  },
});
