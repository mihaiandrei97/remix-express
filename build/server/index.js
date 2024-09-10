// server/index.ts
import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
var viteDevServer = process.env.NODE_ENV === "production" ? void 0 : await import("vite").then(
  (vite) => vite.createServer({
    server: { middlewareMode: true }
  })
);
var app = express();
app.use(compression());
app.disable("x-powered-by");
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}
app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));
async function getBuild() {
  try {
    const build = viteDevServer ? await viteDevServer.ssrLoadModule("virtual:remix/server-build") : (
      // eslint-disable-next-line import/no-unresolved
      await import("./remix.js")
    );
    return { build, error: null };
  } catch (error) {
    console.error("Error creating build:", error);
    return { error, build: null };
  }
}
app.all(
  "*",
  createRequestHandler({
    build: async () => {
      const { error, build } = await getBuild();
      if (error) {
        throw error;
      }
      return build;
    }
  })
);
var port = process.env.PORT || 3e3;
app.listen(
  port,
  () => console.log(`Express server listening at http://localhost:${port}`)
);
