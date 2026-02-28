import http from "node:http";
import { compose } from "./compose.mjs";
import { createContext } from "./context.mjs";
import { createRouteTable, addRoute } from "./router-utils.mjs";

import errors from "./middleware/errors.mjs";
import json from "./middleware/json.mjs";
import logger from "./middleware/logger.mjs";
import router from "./middleware/router.mjs";

export default function Tiny() {
  const app = {
      _middlewares: [],
      _routes: createRouteTable(),

      use(mw) {
          if (typeof mw !== "function") throw new TypeError("middleware must be a function");
          this._middlewares.push(mw);
          return this;
      },

      get(path, handler) {
          addRoute(this, "GET", path, handler);
          return this;
      },
      post(path, handler) {
          addRoute(this, "POST", path, handler);
          return this;
      },
      put(path, handler) {
          addRoute(this, "PUT", path, handler);
          return this;
      },
      patch(path, handler) {
          addRoute(this, "PATCH", path, handler);
          return this;
      },
      delete(path, handler) {
          addRoute(this, "DELETE", path, handler);
          return this;
      },

      listen(port, cb) {
          const run = compose(this._middlewares);

          const server = http.createServer((req, res) => {
              const ctx = createContext(this, req, res);

              // Ensure we always end with *something* if nobody handled it.
              run(ctx).then(() => finalizeResponse(ctx)).catch((err) => {
                  // last-resort safety net (errors() should catch most)
                  console.error(err);
                  if (!res.writableEnded) {
                      res.statusCode = 500;
                      res.setHeader("content-type", "application/json; charset=utf-8");
                      res.end(JSON.stringify({ error: "Internal Server Error" }));
                  }
              });
          });

          return server.listen(port, cb);
      },

  };

  return app;
}

// Middleware exports
Tiny.json = json;
Tiny.logger = logger;
Tiny.errors = errors;
Tiny.router = router;

// If nothing wrote a response, default to 404 JSON.
function finalizeResponse(ctx) {
  const { res } = ctx;

  if (res.writableEnded) return;

  // If router matched but handler sent nothing, router sets 204 + ends.
  // So this is: "no one handled it".
  res.statusCode = 404;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ error: "Not Found" }));
}