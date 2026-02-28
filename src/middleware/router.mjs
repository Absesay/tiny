function router() {
    return async (ctx, next) => {
        const { app, req } = ctx;

        const method = (req.method || "GET").toUpperCase();
        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

        // normalize (no trailing slash except root)
        const path = normalizePath(url.pathname);

        ctx.method = method;
        ctx.url = url;
        ctx.path = path;
        ctx.query = url.searchParams;

        const table = app._routes[method];
        const handler = table ? table.get(path) : undefined;

        if (!handler) return next();

        ctx._matchedRoute = true;

        // Run handler with ctx only.
        const result = handler(ctx);

        // If handler returns a value and response isn't ended, auto-send it.
        if (!ctx.res.writableEnded) {
            const value = await Promise.resolve(result);
            if (value !== undefined) ctx.send(value);
            else {
                // Deterministic default if route matched but handler sent nothing:
                // No Content.
                ctx.status ||= 204;
                ctx.res.end();
            }
        }
    };
}