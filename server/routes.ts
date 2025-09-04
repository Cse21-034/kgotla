import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from "../backend/src/routes/authRoutes";
import { securityMiddleware, requestLogger, errorHandler, notFoundHandler } from "../backend/src/middleware/securityMiddleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware
  app.use(securityMiddleware);
  app.use(requestLogger);

  // Auth routes from separated backend
  app.use('/api/auth', authRoutes);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root route for testing
  app.get('/', (req, res) => {
    res.json({ 
      message: "Kgotla API Server", 
      status: "running",
      version: "2.0.0",
      architecture: "separated backend/frontend",
      endpoints: {
        auth: "/api/auth/*",
        health: "/api/health"
      }
    });
  });

  // Placeholder routes for app functionality (to be implemented)
  app.get('/api/posts', (req, res) => {
    res.json({ message: "Posts endpoint - to be implemented with new architecture" });
  });

  app.get('/api/groups', (req, res) => {
    res.json({ message: "Groups endpoint - to be implemented with new architecture" });
  });

  // Error handling middleware
  app.use(errorHandler);
  app.use(notFoundHandler);

  const httpServer = createServer(app);

  return httpServer;
}
