// The Worker's public address, for the links it hands back (the stylesheet).
export const publicOrigin = () => {
  const origin = process.env.HAIRLINE_PUBLIC_URL;

  if (origin === undefined || origin === "") {
    throw new Error("HAIRLINE_PUBLIC_URL is not set: the Worker's public URL, e.g. https://hairline-mcp.example.workers.dev");
  }

  return origin;
};
