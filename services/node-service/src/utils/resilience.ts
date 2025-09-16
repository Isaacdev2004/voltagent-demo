import { Policy, RetryPolicy, CircuitBreakerPolicy } from 'cockatiel';

export function createRetryPolicy(): RetryPolicy {
  return Policy
    .handleAll()
    .retry()
    .attempts(5)
    .exponential({
      initialDelay: 100,
      maxDelay: 2000,
      factor: 2,
    });
}

export function createCircuitBreaker(): CircuitBreakerPolicy {
  return Policy
    .handleAll()
    .circuitBreaker(5, 10000, {
      halfOpenAfter: 30000,
    });
}
