export async function startServer(app) {
  const server = app.listen(0);
  await onceListening(server);

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () => new Promise((resolve) => server.close(() => resolve()))
  };
}

function onceListening(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

export async function readJson(res) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
