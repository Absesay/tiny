# Tiny

A Koa-like middleware server built on top of `node:http`.

## Usage

```js
import { createApp, logger, jsonBody } from "tiny";

const app = createApp();

app.use(logger());
app.use(jsonBody());

app.router.get("/health", (ctx) => ctx.text("ok"));

app.router.post("/echo", (ctx) => {
  ctx.json({ got: ctx.request.body });
});

app.use(app.router.routes());

app.listen(3000);
