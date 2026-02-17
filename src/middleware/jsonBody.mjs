export function jsonBody({
  limit = 1_000_000,
  // parse on these methods by default
  methods = ["POST", "PUT", "PATCH", "DELETE"]
} = {}) {
  return async (ctx, next) => {
    if (!methods.includes(ctx.method)) return next();

    const contentType = String(ctx.get("content-type") ?? "");
    const isJson = contentType.toLowerCase().includes("application/json");
    if (!isJson) return next();

    try {
      const text = await ctx.bodyText({ limit });

      // empty body should remain undefined (useful for endpoints that allow empty JSON)
      if (text.trim() === "") {
        ctx.request.body = undefined;
        return next();
      }

      ctx.request.body = JSON.parse(text);
      return next();
    } catch (err) {
      if (err && err.code === "BODY_TOO_LARGE") {
        if (!ctx.res.writableEnded) ctx.status(413).json({ error: "payload_too_large" });
        return;
      }

      // invalid JSON
      if (!ctx.res.writableEnded) ctx.status(400).json({ error: "invalid_json" });
    }
  };
}