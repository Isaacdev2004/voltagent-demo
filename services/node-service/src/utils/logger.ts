import pino from 'pino';

export function createLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    } : undefined,
    formatters: {
      level: (label) => {
        return { level: label };
      }
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      service: 'voltagent-node-service',
      version: process.env.npm_package_version || '1.0.0'
    },
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
        request_id: req.headers['x-request-id'] || 'unknown'
      }),
      res: (res) => ({
        statusCode: res.statusCode,
        request_id: res.getHeader('x-request-id') || 'unknown'
      })
    }
  });
}
