import { Logger } from 'pino';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    fastapi: 'ok' | 'error';
    memory: 'ok' | 'error';
  };
}

export class HealthService {
  private logger: Logger;
  private startTime: number;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = Date.now();
  }

  getHealth(): HealthStatus {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;

    // Check memory usage (warn if over 500MB)
    const memoryStatus = memoryUsageMB > 500 ? 'error' : 'ok';

    const health: HealthStatus = {
      status: memoryStatus === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        fastapi: 'ok', // This could be enhanced to actually check FastAPI service
        memory: memoryStatus,
      },
    };

    if (health.status === 'error') {
      this.logger.warn('Health check failed', { health });
    }

    return health;
  }
}
