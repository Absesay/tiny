// A method to compose middleware
export function compose(middlewares) {
  return function run(ctx) {
    let index = -1;
    return dispatch(0);

    function dispatch(i) {
      if (i <= index) return Promise.reject(new Error("next() called multiple times"));
      index = i;

      const fn = middlewares[i];
      if (!fn) return Promise.resolve();

      return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
    }
  };
}
