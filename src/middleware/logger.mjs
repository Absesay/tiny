export function logger({ log = console.log } = {}) {
  return async (ctx, next) => {
    const t0 = Date.now();
    try {
      await next();
    } finally {
      const ms = Date.now() - t0;
      const status = ctx.res.statusCode;
      log(`${ctx.method} ${ctx.path} ${status} ${ms}ms`);
    }
  };
}