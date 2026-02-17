// A method to create the shared context
import { URL } from "node:url";

export function createContext(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  const ctx = {
    req,
    res,

    url,
    method: req.method ?? "GET",
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),

    params: {},
    state: {},

    // request "namespace" (handy place for middleware to attach parsed data)
    request: {
      body: undefined
    },

    // response helpers
    status(code) {
      res.statusCode = code;
      return ctx;
    },

    set(name, value) {
      res.setHeader(name, value);
      return ctx;
    },

    get(name) {
      // Node lowercases incoming headers keys in req.headers
      return req.headers[String(name).toLowerCase()];
    },

    text(str) {
      if (!res.getHeader("content-type")) ctx.set("content-type", "text/plain; charset=utf-8");
      res.end(str);
    },

    json(data) {
      if (!res.getHeader("content-type")) ctx.set("content-type", "application/json; charset=utf-8");
      res.end(JSON.stringify(data));
    },

    send(body) {
      if (body == null) return res.end();
      if (Buffer.isBuffer(body)) return res.end(body);
      if (typeof body === "string") return res.end(body);
      return ctx.json(body);
    },

    // lazy body readers
    async bodyBuffer({ limit = 1_000_000 } = {}) {
      return readStream(req, { limit });
    },

    async bodyText(opts) {
      const buf = await ctx.bodyBuffer(opts);
      return buf.toString("utf8");
    },

    async bodyJson(opts) {
      const txt = await ctx.bodyText(opts);
      return JSON.parse(txt);
    }
  };

  return ctx;
}

function readStream(stream, { limit }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    stream.on("data", (chunk) => {
      size += chunk.length;

      if (size > limit) {
        const err = new Error("Body too large");
        err.code = "BODY_TOO_LARGE";
        // destroy emits 'error' in many cases; also reject now for safety
        stream.destroy(err);
        reject(err);
        return;
      }

      chunks.push(chunk);
    });

    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
