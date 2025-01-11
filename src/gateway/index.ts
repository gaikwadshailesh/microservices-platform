import express, { Router, Request, Response, NextFunction } from 'express';
import { ServiceRegistry } from './registry';
import axios, { AxiosError } from 'axios';
import os from 'os';

const registry = new ServiceRegistry();
const router = Router();

// Register services
registry.register('users', 'http://localhost:8001');
registry.register('products', 'http://localhost:8002');

// Metrics storage (in-memory for demo)
let metrics: Array<{
  endpoint: string;
  method: string;
  responseTime: number;
  timestamp: string;
  statusCode: number;
  service: string;
  circuitBreakerState?: string;
}> = [];

// System metrics storage
let systemMetrics: Array<{
  timestamp: string;
  cpu: number;
  memory: {
    total: number;
    free: number;
    used: number;
  };
}> = [];

// Collect system metrics every 5 seconds
setInterval(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  systemMetrics.push({
    timestamp: new Date().toISOString(),
    cpu: os.loadavg()[0], // 1 minute load average
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem
    }
  });

  // Keep only last 100 measurements
  if (systemMetrics.length > 100) {
    systemMetrics = systemMetrics.slice(-100);
  }
}, 5000);

// Error handling middleware
const handleServiceError = (error: any, res: Response) => {
  if (error.message.includes('Circuit breaker is OPEN')) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      details: 'Circuit breaker is open due to multiple failures'
    });
  }

  const status = error.response?.status || 500;
  const message = error.response?.data?.message || error.message;

  res.status(status).json({
    error: 'Service error',
    details: message
  });
};

// Middleware to collect metrics
router.use((req, res, next) => {
  const start = Date.now();
  const service = req.path.split('/')[1];

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.push({
      endpoint: req.path,
      method: req.method,
      responseTime: duration,
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      service: service
    });

    // Keep only last 100 requests
    if (metrics.length > 100) {
      metrics = metrics.slice(-100);
    }
  });
  next();
});

// Authentication check middleware
const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Forward auth headers middleware
const forwardAuth = (req: Request) => ({
  headers: {
    'Cookie': req.headers.cookie || '',
    'Authorization': req.headers.authorization || '',
    'X-Forwarded-User': req.user ? JSON.stringify(req.user) : ''
  }
});

// Users Service Routes with authentication and circuit breaker
router.get('/users', checkAuth, async (req, res) => {
  try {
    const serviceUrl = await registry.getService('users');
    const response = await axios.get(`${serviceUrl}/users`, forwardAuth(req));
    res.json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

router.post('/users', checkAuth, async (req, res) => {
  try {
    const serviceUrl = await registry.getService('users');
    const response = await axios.post(`${serviceUrl}/users`, req.body, forwardAuth(req));
    res.json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Products Service Routes with authentication and circuit breaker
router.get('/products', checkAuth, async (req, res) => {
  try {
    const serviceUrl = await registry.getService('products');
    const response = await axios.get(`${serviceUrl}/products`, forwardAuth(req));
    res.json(response.data);
  } catch (error) {
    handleServiceError(error, res);
  }
});

// Health Check and Metrics Routes with enhanced monitoring
router.get('/health', async (req, res) => {
  try {
    const services = await registry.getHealthStatus();
    const health = {
      uptime: process.uptime(),
      services,
      timestamp: Date.now()
    };
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Health check failed',
      details: error.message
    });
  }
});

router.get('/metrics', checkAuth, (req, res) => {
  const response = {
    requests: metrics,
    system: systemMetrics
  };
  res.json(response);
});

export default router;