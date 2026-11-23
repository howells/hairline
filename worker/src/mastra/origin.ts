// The Worker's public address, for the links it hands back (the stylesheet).
import { env } from "cloudflare:workers";
import { z } from "zod";

const envSchema = z.object({ HAIRLINE_PUBLIC_URL: z.string().min(1) });

export const publicOrigin = () => {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      "HAIRLINE_PUBLIC_URL is not set: the Worker's public URL, e.g. https://hairline-mcp.example.workers.dev"
    );
  }

  return parsed.data.HAIRLINE_PUBLIC_URL;
};
