function errors() {
    return async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            // If user code throws an httpError, use it
            const status = err?.statusCode || err?.status || 500;
            const message = status >= 500 ? "Internal Server Error" : (err?.message || "Error");

            if (!ctx.res.writableEnded) {
                ctx.status = status;
                ctx.json({ error: message });
            }
            // Also log server errors
            if (status >= 500) console.error(err);
        }
    };
}