import type { Express } from "express";
import { createServer, type Server } from "http";
import gatewayRouter from "../gateway/index";
import { setupAuth } from "./auth";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // API Gateway routes for microservices, including health and metrics endpoints
  app.use("/api", gatewayRouter);

  const httpServer = createServer(app);
  return httpServer;
}