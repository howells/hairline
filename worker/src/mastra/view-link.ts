// The link format: a render input, deflated and base64url-encoded into the
// path, so the link needs no storage. view.ts reads it back.
import type { RenderInput } from "./tools/charts";

export const VIEW_PATH = "/view";

/** Longer links are dropped: some clients and proxies cut URLs past about 8 KB. */
const MAX_URL_LENGTH = 8000;

/** Base64url expands 3 bytes to 4 characters; anything bigger can never fit in MAX_URL_LENGTH. */
const MAX_PACKED_BYTES = Math.floor((MAX_URL_LENGTH * 3) / 4);

/** Hard ceiling on decompressed token JSON to block deflate bombs on the public GET route. */
const MAX_UNPACKED_BYTES = 128 * 1024;

const compress = async (bytes: Uint8Array<ArrayBuffer>) =>
  new Uint8Array(
    await new Response(
      new Blob([bytes])
        .stream()
        .pipeThrough(new CompressionStream("deflate-raw"))
    ).arrayBuffer()
  );

const limitBytes = (maxBytes: number) => {
  let total = 0;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;

      if (total > maxBytes) {
        controller.error(
          new Error("View link exceeds decompressed size limit.")
        );

        return;
      }

      controller.enqueue(chunk);
    },
  });
};

const decompress = async (bytes: Uint8Array<ArrayBuffer>, maxBytes: number) =>
  new Uint8Array(
    await new Response(
      new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("deflate-raw"))
        .pipeThrough(limitBytes(maxBytes))
    ).arrayBuffer()
  );

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  const step = 32_768;

  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCodePoint(...bytes.subarray(i, i + step));
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

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
  const packed = await compress(
    new TextEncoder().encode(JSON.stringify(input))
  );

  const url =
    packed.byteLength > MAX_PACKED_BYTES
      ? undefined
      : new URL(`${VIEW_PATH}/${kind}/${toBase64Url(packed)}`, origin).href;

  return url !== undefined && url.length <= MAX_URL_LENGTH ? url : undefined;
};

/** The JSON text a link's token holds; throws when the token is damaged or oversized. */
export const unpackView = async (token: string) => {
  if (token.length > MAX_URL_LENGTH) {
    throw new Error("View link token is too long.");
  }

  return new TextDecoder().decode(
    await decompress(fromBase64Url(token), MAX_UNPACKED_BYTES)
  );
};
