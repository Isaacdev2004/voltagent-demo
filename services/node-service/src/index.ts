import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from './utils/logger';
import { setupTracing } from './utils/tracing';
import { createRetryPolicy, createCircuitBreaker } from './utils/resilience';
import { FastAPIClient } from './services/fastapi-client';
import { HealthService } from './services/health-service';

// Initialize tracing first
setupTracing();

const logger = createLogger();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const fastAPIClient = new FastAPIClient(logger);
const healthService = new HealthService(logger);

// Retry policy for external API calls
const retryPolicy = createRetryPolicy();
const circuitBreaker = createCircuitBreaker();

// Routes
app.get('/health', (req, res) => {
  const health = healthService.getHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

app.post('/completions', async (req, res) => {
  const span = tracer.startSpan('completions_request');
  
  try {
    logger.info('Received completions request', { 
      body: req.body,
      headers: req.headers 
    });

    // Validate API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      logger.error('API_KEY not configured');
      return res.status(500).json({ error: 'Service not configured' });
    }

    // Make request to FastAPI service with retry and circuit breaker
    const result = await circuitBreaker.execute(async () => {
      return await retryPolicy.execute(async () => {
        return await fastAPIClient.callCompletions(req.body, apiKey);
      });
    });

    span.setStatus({ code: 1 }); // OK
    logger.info('Completions request successful', { result });
    res.json(result);

  } catch (error) {
    span.setStatus({ code: 2, message: error.message }); // ERROR
    logger.error('Completions request failed', { error: error.message });
    
    if (error.name === 'CircuitBreakerOpenError') {
      res.status(503).json({ error: 'Service temporarily unavailable' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    span.end();
  }
});

// Demo endpoint to show AutoGen.js-like functionality
app.post('/agent/demo', async (req, res) => {
  const span = tracer.startSpan('agent_demo');
  
  try {
    logger.info('Received agent demo request', { body: req.body });

    // Simulate agent processing
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Process with retry policy
    const result = await retryPolicy.execute(async () => {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return {
        response: `Agent processed: "${message}"`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      };
    });

    span.setStatus({ code: 1 });
    logger.info('Agent demo completed', { result });
    res.json(result);

  } catch (error) {
    span.setStatus({ code: 2, message: error.message });
    logger.error('Agent demo failed', { error: error.message });
    res.status(500).json({ error: 'Agent processing failed' });
  } finally {
    span.end();
  }
});

// /run endpoint for agent_custom service - calls gateway with X-API-Key
app.post('/run', async (req, res) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const span = tracer.startSpan('agent_run');
  
  span.setAttributes({
    'request.id': requestId,
    'service.name': 'agent_custom',
    'endpoint': '/run'
  });

  try {
    logger.info('Received /run request', { 
      request_id: requestId,
      body: req.body,
      headers: req.headers 
    });

    // Validate API key
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      logger.error('API_KEY not configured', { request_id: requestId });
      return res.status(500).json({ error: 'Service not configured' });
    }

    // Make request to FastAPI service with retry and circuit breaker
    let attempt = 0;
    const result = await circuitBreaker.execute(async () => {
      return await retryPolicy.execute(async (context) => {
        attempt = context.attempt;
        const attemptStartTime = Date.now();
        
        logger.info('Attempting gateway call', { 
          request_id: requestId,
          attempt: attempt,
          attempt_start_time: attemptStartTime
        });

        try {
          const response = await fastAPIClient.callCompletions(req.body, apiKey);
          const attemptLatency = Date.now() - attemptStartTime;
          
          logger.info('Gateway call successful', { 
            request_id: requestId,
            attempt: attempt,
            latency_ms: attemptLatency,
            status: 'success'
          });
          
          return response;
        } catch (error) {
          const attemptLatency = Date.now() - attemptStartTime;
          
          logger.warn('Gateway call failed', { 
            request_id: requestId,
            attempt: attempt,
            latency_ms: attemptLatency,
            status: 'failed',
            error: error.message
          });
          
          throw error;
        }
      });
    });

    const totalLatency = Date.now() - startTime;
    span.setStatus({ code: 1 }); // OK
    span.setAttributes({
      'response.status': 'success',
      'response.latency_ms': totalLatency,
      'response.attempts': attempt
    });
    
    logger.info('Run request completed successfully', { 
      request_id: requestId,
      latency_ms: totalLatency,
      status: 'success',
      attempts: attempt,
      result: result
    });
    
    res.json({
      request_id: requestId,
      status: 'success',
      latency_ms: totalLatency,
      attempts: attempt,
      result: result
    });

  } catch (error) {
    const totalLatency = Date.now() - startTime;
    span.setStatus({ code: 2, message: error.message }); // ERROR
    span.setAttributes({
      'response.status': 'error',
      'response.latency_ms': totalLatency,
      'response.attempts': attempt
    });
    
    logger.error('Run request failed', { 
      request_id: requestId,
      latency_ms: totalLatency,
      status: 'error',
      attempts: attempt,
      error: error.message
    });
    
    if (error.name === 'CircuitBreakerOpenError') {
      res.status(503).json({ 
        request_id: requestId,
        status: 'error',
        latency_ms: totalLatency,
        error: 'Service temporarily unavailable' 
      });
    } else {
      res.status(500).json({ 
        request_id: requestId,
        status: 'error',
        latency_ms: totalLatency,
        error: 'Internal server error' 
      });
    }
  } finally {
    span.end();
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  logger.info(`VoltAgent Node service running on port ${port}`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Import tracer after setupTracing
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('voltagent-node-service');
