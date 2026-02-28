function logger() {
  return async (ctx, next) => {
      const start = Date.now();
      try {
          await next();
      } finally {
          const ms = Date.now() - start;
          const status = ctx.res.statusCode || ctx.status || 200;
          console.log(`${ctx.req.method} ${ctx.req.url} --> ${status} (${ms}ms)`);
      }
  };
}