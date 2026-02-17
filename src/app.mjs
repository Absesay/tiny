import http from "node:http";
import { compose } from "./compose.mjs";
import { createContext } from "./context.mjs";
import { createRouter } from "./router.mjs";

export function createApp() {
  const middlewares = [];
  const app = {
    router: createRouter(),

    use(fn) {
      middlewares.push(fn);
      return app;
    },

    onError(fn) {
      app._onError = fn;
      return app;
    },

    handler() {
      const fn = compose([...middlewares, finalResponder()]);
      return async (req, res) => {
        const ctx = createContext(req, res);
        try {
          await fn(ctx);
        } catch (err) {
          handleError(app, ctx, err);
        }
      };
    },

    listen(port, host, cb) {
      const server = http.createServer(app.handler());
      return server.listen(port, host, cb);
    }
  };

  return app;
}

function finalResponder() {
  return async (ctx) => {
    if (!ctx.res.writableEnded) {
      ctx.status(404).json({ error: "not_found" });
    }
  };
}

function handleError(app, ctx, err) {
  if (ctx.res.writableEnded) return;

  if (typeof app._onError === "function") {
    try {
      app._onError(err, ctx);
    } catch {
      // swallow errors from onError hook; still send 500 below
    }
  }

  ctx.res.statusCode = 500;
  ctx.res.setHeader("content-type", "application/json; charset=utf-8");
  ctx.res.end(JSON.stringify({ error: "internal_error" }));
}