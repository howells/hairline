// A static server for acceptance/dist, so the pages load over http as a host's would.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PORT } from "./port.ts";

const dist = fileURLToPath(new URL("dist/", import.meta.url));

const TYPES = new Map([
  [".css", "text/css"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript"],
]);

const typeOf = (file: string) =>
  TYPES.get(path.extname(file)) ?? "application/octet-stream";

createServer((request, response) => {
  const file = path.normalize(
    new URL(request.url ?? "/", "http://localhost").pathname
  );

  try {
    const body = readFileSync(path.join(dist, file));
    response.writeHead(200, { "content-type": typeOf(file) });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(PORT);
