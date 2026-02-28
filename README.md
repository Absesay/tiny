# Tiny

A Koa-like middleware server built on top of `node:http`.

## Usage

```js
import Tiny from "tiny";

const app = Tiny();

app
  .use(Tiny.errors())
  .use(Tiny.logger())
  .use(Tiny.json())
  .use(Tiny.router());

app.get("/", (ctx) => ({ ok: true }));
app.post("/echo", (ctx) => ({ body: ctx.body }));

app.listen(3000, () => console.log("Listening on 3000"));
