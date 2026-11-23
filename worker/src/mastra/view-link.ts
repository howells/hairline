// The link format: a render input, deflated and base64url-encoded into the
// path, so the link needs no storage. view.ts reads it back.
import type { RenderInput } from "./tools/charts";

export const VIEW_PATH = "/view";

/** Longer links are dropped: some clients and proxies cut URLs past about 8 KB. */
const MAX_URL_LENGTH = 8000;

const pipe = async (
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
) =>
  new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(stream)
    ).arrayBuffer()
  );

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCodePoint(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

const fromBase64Url = (text: string) =>
  Uint8Array.from(
    atob(text.replaceAll("-", "+").replaceAll("_", "/")),
    (c) => c.codePointAt(0) ?? 0
  );

/** The link that draws this input as a document, or undefined when it would be too long. */
export const viewUrl = async (
  kind: string,
  input: RenderInput,
  origin: string
) => {
  const packed = await pipe(
    new TextEncoder().encode(JSON.stringify(input)),
    new CompressionStream("deflate-raw")
  );

  const url = new URL(`${VIEW_PATH}/${kind}/${toBase64Url(packed)}`, origin)
    .href;

  return url.length <= MAX_URL_LENGTH ? url : undefined;
};

/** The JSON text a link's token holds; throws when the token is damaged. */
export const unpackView = async (token: string) =>
  new TextDecoder().decode(
    await pipe(fromBase64Url(token), new DecompressionStream("deflate-raw"))
  );
