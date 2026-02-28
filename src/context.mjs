// ---------------------------
// Context
// ---------------------------

function createContext(app, req, res) {
  const ctx = {
      app,
      req,
      res,

      // request-derived (set by router if used)
      method: (req.method || "GET").toUpperCase(),
      url: undefined,
      path: undefined,
      query: undefined,

      // userland - get user info / state
      state: {},
      body: undefined,

      // response state
      status: {},

      set(name, value) {
          res.setHeader(name, value);
      },

      text(str) {
          if (res.writableEnded) return;
          if (!res.getHeader("content-type")) {
              res.setHeader("content-type", "text/plain; charset=utf-8");
          }
          res.statusCode = ctx.status || res.statusCode || 200;
          res.end(String(str));
      },

      json(obj) {
          if (res.writableEnded) return;
          if (!res.getHeader("content-type")) {
              res.setHeader("content-type", "application/json; charset-utf-8");
          }
          res.statusCode = ctx.status || res.statusCode || 200;
          res.end(JSON.stringify(obj));
      },

      send(value) {
          if (res.writableEnded) return;

          // Allow Buffer
          if (Buffer.isBuffer(value)) {
              res.statusCode = ctx.status || res.statusCode || 200;
              res.end(value);
              return;
          }

          // Strings to text
          if (typeof value === "string") {
              ctx.text(value);
              return;
          }

          // Everything else to JSON
          ctx.json(value);
      },

      throw(statusCode, message = "Error") {
          const err = new Error(message);
          err.statusCode = statusCode;
          throw err;
      },

      _matchedRoute: false,
  };

  return ctx;
}