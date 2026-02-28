// ---------------------------
// Routing internals
// ---------------------------

function createRouteTable() {
  return {
      GET: new Map(),
      POST: new Map(),
      PUT: new Map(),
      PATCH: new Map(),
      DELETE: new Map(),
      OPTIONS: new Map(),
      HEAD: new Map(),
  };
}

function addRoute(app, method, path, handler) {
  if (typeof path !== "string") throw new TypeError("path must be a string");
  if (typeof handler !== "function") throw new TypeError("handler must be a function");

  const p = normalizePath(path);
  app._routes[method].set(p, handler);
}

function normalizePath(path) {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}