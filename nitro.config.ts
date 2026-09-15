import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  preset: "bun",
  vercel: {},
  experimental: {
    database: true,
    openAPI: true,
  },
  database: {
    default: {
      connector: "postgresql",
      options: {
        url: process.env.DATABASE_URL as string,
      },
    },
  },
  openAPI: {
    meta: {
      title: "Convoi API",
      description: "API documentation for Convoi app",
      version: "1.0.0",
    },
    production: false,
    route: "/docs/openapi.json",
    ui: {
      scalar: {
        route: "/docs/scalar",
      },
      swagger: {
        route: "/docs/swagger",
      },
    },
  },
  routeRules: {
    "/api/**": {
      cors: {
        origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
        credentials: true,
        methods: ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
    },
  },
});
