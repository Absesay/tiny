function json({ limitBytes = 1_000_000 } = {}) {
  return async (ctx, next) => {
      const req = ctx.req;

      const method = (req.method || "GET").toUpperCase();
      const ct = req.headers["content-type"] || "";
      const hasBody = !["GET", "HEAD"].includes(method);

      if (!hasBody || !ct.includes("application/json")) {
          return next();
      }

      const chunks = [];
      let total = 0;

      for await (const chunk of req) {
          total += chunk.length;
          if (total > limitBytes) {
              ctx.status = 413;
              ctx.json({ error: "Payload too large" });
              return; // short-circuit
          }
          chunks.push(chunk);
      }

      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw.length === 0) {
          ctx.body = undefined;
          return next();
      }

      try {
          ctx.body = JSON.parse(raw);
          return next();
      } catch {
          ctx.status = 400;
          ctx.json({ error: "Invalid JSON" });
          return;
      }
  };
}