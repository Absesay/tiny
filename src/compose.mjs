// ---------------------------
// Middleware composer
// ---------------------------

function compose(middlewares) {
  return function run(ctx) {
      let index = -1;

      async function dispatch(i) {
          if (i <= index) throw new Error("next() called multiple times");
          index = i;

          const fn = middlewares[i];
          if (!fn) return;

          await fn(ctx, () => dispatch(i + 1));
      }

      return dispatch(0);
  };
}