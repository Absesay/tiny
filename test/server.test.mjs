import { describe, it, expect } from "vitest";
import { createApp } from "../src/app.mjs";
import { logger } from "../src/middleware/logger.mjs";
import { jsonBody } from "../src/middleware/jsonBody.mjs";
import { startServer, readJson } from "./testUtils.mjs";

describe("tiny-http", () => {
  it("compose order: downstream then upstream", async () => {
    const app = createApp();
    const order = [];

    app.use(async (ctx, next) => {
      order.push("a:before");
      await next();
      order.push("a:after");
    });

    app.use(async (ctx, next) => {
      order.push("b:before");
      await next();
      order.push("b:after");
    });

    app.router.get("/t", (ctx) => {
      order.push("handler");
      ctx.text("ok");
    });

    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/t`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");

    expect(order).toEqual(["a:before", "b:before", "handler", "b:after", "a:after"]);

    await srv.close();
  });

  it("route params: /users/:id", async () => {
    const app = createApp();

    app.router.get("/users/:id", (ctx) => {
      ctx.json({ id: ctx.params.id });
    });

    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/users/42`);
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ id: "42" });

    await srv.close();
  });

  it("404: unmatched route returns not_found", async () => {
    const app = createApp();
    app.use(app.router.routes()); // no routes registered

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/nope`);
    expect(res.status).toBe(404);
    expect(await readJson(res)).toEqual({ error: "not_found" });

    await srv.close();
  });

  it("error path: thrown error => 500 + onError hook called", async () => {
    const app = createApp();
    let seen = null;

    app.onError((err, ctx) => {
      seen = { message: err.message, path: ctx.path };
    });

    app.router.get("/boom", () => {
      throw new Error("boom");
    });

    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/boom`);
    expect(res.status).toBe(500);
    expect(await readJson(res)).toEqual({ error: "internal_error" });

    expect(seen).toEqual({ message: "boom", path: "/boom" });

    await srv.close();
  });

  it("jsonBody middleware parses JSON into ctx.request.body", async () => {
    const app = createApp();
    app.use(jsonBody({ limit: 10_000 }));

    app.router.post("/echo", (ctx) => {
      ctx.json({ got: ctx.request.body });
    });

    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ a: 1 })
    });

    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({ got: { a: 1 } });

    await srv.close();
  });

  it("jsonBody invalid JSON => 400 invalid_json", async () => {
    const app = createApp();
    app.use(jsonBody());

    app.router.post("/echo", (ctx) => ctx.json({ got: ctx.request.body }));
    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/echo`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not valid json"
    });

    expect(res.status).toBe(400);
    expect(await readJson(res)).toEqual({ error: "invalid_json" });

    await srv.close();
  });

  it("logger middleware does not crash and logs", async () => {
    const app = createApp();
    const lines = [];
    app.use(logger({ log: (s) => lines.push(s) }));

    app.router.get("/x", (ctx) => ctx.text("ok"));
    app.use(app.router.routes());

    const srv = await startServer(app);
    const res = await fetch(`${srv.baseUrl}/x`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("GET /x 200");

    await srv.close();
  });
});
