// The built React-free entry, as the build scripts read it. The package
// names itself, so Node resolves this to lib/schema.js; the declaration
// lets the scripts type-check before that file exists.
declare module "@howells/hairline/schema" {
  import type { ZodType } from "zod";

  export const registry: readonly {
    component: string;
    jobs: readonly string[];
    kind: string;
    schema: ZodType;
    whenToUse: string;
  }[];
}
