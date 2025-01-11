import { EventEmitter } from 'events';

enum State {
  CLOSED,
  OPEN,
  HALF_OPEN
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenMaxRequests?: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: State = State.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: number;
  private successCount: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxRequests: number;

  constructor(options: CircuitBreakerOptions = {}) {
    super();
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 10000; // 10 seconds
    this.halfOpenMaxRequests = options.halfOpenMaxRequests || 3;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === State.OPEN) {
      if (this.shouldResetCircuit()) {
        this.transitionToHalfOpen();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === State.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxRequests) {
        this.transitionToClosed();
      }
    }

    this.emit('success');
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      (this.state === State.CLOSED && this.failureCount >= this.failureThreshold) ||
      this.state === State.HALF_OPEN
    ) {
      this.transitionToOpen();
    }

    this.emit('failure');
  }

  private transitionToOpen(): void {
    this.state = State.OPEN;
    this.emit('open');
  }

  private transitionToHalfOpen(): void {
    this.state = State.HALF_OPEN;
    this.successCount = 0;
    this.emit('half-open');
  }

  private transitionToClosed(): void {
    this.state = State.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.emit('closed');
  }

  private shouldResetCircuit(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.resetTimeout;
  }

  getState(): string {
    return State[this.state];
  }
}
