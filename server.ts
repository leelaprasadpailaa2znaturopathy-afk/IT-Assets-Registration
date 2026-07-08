import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { connectDatabase } from "./server/services/dbConnector";
import apiRouter from "./server/routes/index";

// Configure local envs
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function bootstrap() {
  const app = express();

  // 1. Database Connection check
  await connectDatabase();

  // 2. Middlewares
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // 3. Register backend routes
  app.use("/api", apiRouter);

  // 4. Vite Dev Server / Static files for production
  if (!isProduction) {
    console.log("🛠️ Starting Express with Hot Vite development middleware...");

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { port: 24679 } },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    console.log("📦 Starting production serving environment...");
    const distPath = path.join(process.cwd(), "dist");

    // Static assets
    app.use(express.static(distPath));

    // Handle single-page app returns
    app.get("*", (req, res, next) => {
      // Avoid intercepting API routes accidentally
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to host 0.0.0.0 and Port as mandated by standard proxy
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🚀 Server up and running on: http://localhost:${PORT}`);
    console.log(`👉 Development App URL: ${process.env.APP_URL || "N/A"}`);
    console.log(`===============================================`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Try killing the process or setting a different PORT in .env`);
      process.exit(1);
    }
  });
}

bootstrap().catch((err) => {
  console.error("🛑 Failed to bootstrap full stack application server:", err);
});