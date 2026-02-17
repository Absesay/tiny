// Tiny param routing
export function createRouter() {
  const routes = [];

  function add(method, path, handler) {
    routes.push({ method, path, matcher: compilePath(path), handler });
  }

  const router = {
    get: (p, h) => (add("GET", p, h), router),
    post: (p, h) => (add("POST", p, h), router),
    put: (p, h) => (add("PUT", p, h), router),
    delete: (p, h) => (add("DELETE", p, h), router),
    patch: (p, h) => (add("PATCH", p, h), router),
    all: (p, h) => (add("ALL", p, h), router),

    routes() {
      return async (ctx, next) => {
        const match = matchRoute(ctx.method, ctx.path, routes);
        if (!match) return next();

        ctx.params = match.params;
        // handler can optionally accept next (for nesting)
        return match.handler(ctx, next);
      };
    }
  };

  return router;
}

function matchRoute(method, path, routes) {
  for (const r of routes) {
    if (r.method !== "ALL" && r.method !== method) continue;
    const params = r.matcher(path);
    if (params) return { handler: r.handler, params };
  }
  return null;
}

function compilePath(path) {
  const keys = [];
  const normalized = (path || "/").replace(/\/+$/g, "") || "/";

  const pattern = normalized.replace(/:[^/]+/g, (s) => {
    keys.push(s.slice(1));
    return "([^/]+)";
  });

  const re = new RegExp(`^${pattern === "/" ? "" : pattern}/?$`);

  return (pathname) => {
    const m = re.exec(pathname);
    if (!m) return null;

    const params = {};
    for (let i = 0; i < keys.length; i++) {
      params[keys[i]] = decodeURIComponent(m[i + 1]);
    }
    return params;
  };
}
