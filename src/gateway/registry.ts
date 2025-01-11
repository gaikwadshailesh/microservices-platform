import axios, { AxiosError } from 'axios';
import { CircuitBreaker } from './circuit-breaker';

export class ServiceRegistry {
  private services: Map<string, string>;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private readonly healthCheckInterval: number = 5000; // 5 seconds

  constructor() {
    this.services = new Map();
    this.circuitBreakers = new Map();
    this.startHealthCheck();
  }

  register(name: string, url: string) {
    this.services.set(name, url);
    if (!this.circuitBreakers.has(name)) {
      const breaker = new CircuitBreaker();

      // Log circuit breaker state changes
      breaker.on('open', () => console.log(`Circuit breaker for ${name} is now OPEN`));
      breaker.on('half-open', () => console.log(`Circuit breaker for ${name} is now HALF-OPEN`));
      breaker.on('closed', () => console.log(`Circuit breaker for ${name} is now CLOSED`));

      this.circuitBreakers.set(name, breaker);
    }
  }

  async getService(name: string): Promise<string> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    const breaker = this.circuitBreakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker for ${name} not found`);
    }

    // Check circuit breaker state before returning service
    if (breaker.getState() === 'OPEN') {
      throw new Error(`Service ${name} is currently unavailable (Circuit Breaker OPEN)`);
    }

    return service;
  }

  private startHealthCheck() {
    setInterval(async () => {
      for (const [name, url] of this.services) {
        const breaker = this.circuitBreakers.get(name);
        if (!breaker) continue;

        try {
          await breaker.execute(async () => {
            const response = await axios.get(`${url}/health`, { timeout: 5000 });
            return response.data?.status === 'healthy';
          });
        } catch (error) {
          console.error(`Health check failed for ${name}: ${(error as AxiosError).message}`);
        }
      }
    }, this.healthCheckInterval);
  }

  async getHealthStatus() {
    const status: Record<string, { status: string; circuitBreaker: string; lastChecked: string }> = {};

    for (const [name, url] of this.services) {
      const breaker = this.circuitBreakers.get(name);
      if (!breaker) continue;

      try {
        await breaker.execute(async () => {
          const response = await axios.get(`${url}/health`, { timeout: 5000 });
          status[name] = {
            status: response.data?.status === 'healthy' ? 'healthy' : 'unhealthy',
            circuitBreaker: breaker.getState(),
            lastChecked: new Date().toISOString()
          };
        });
      } catch (error) {
        status[name] = {
          status: 'unhealthy',
          circuitBreaker: breaker.getState(),
          lastChecked: new Date().toISOString()
        };
      }
    }

    return status;
  }
}