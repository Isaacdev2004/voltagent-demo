import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Logger } from 'pino';

export interface CompletionRequest {
  prompt: string;
  max_tokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  completion: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  timestamp: string;
}

export class FastAPIClient {
  private client: AxiosInstance;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.client = axios.create({
      baseURL: process.env.FASTAPI_URL || 'http://fastapi-service:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('FastAPI request', {
          method: config.method,
          url: config.url,
          headers: config.headers,
        });
        return config;
      },
      (error) => {
        this.logger.error('FastAPI request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('FastAPI response', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        });
        return response;
      },
      (error) => {
        this.logger.error('FastAPI response error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  async callCompletions(
    request: CompletionRequest,
    apiKey: string
  ): Promise<CompletionResponse> {
    try {
      const response: AxiosResponse<CompletionResponse> = await this.client.post(
        '/completions',
        request,
        {
          headers: {
            'X-API-Key': apiKey,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('FastAPI completions call failed', {
        error: error.message,
        request,
      });
      throw error;
    }
  }

  async ping(): Promise<{ status: string }> {
    try {
      const response = await this.client.get('/ping');
      return response.data;
    } catch (error) {
      this.logger.error('FastAPI ping failed', { error: error.message });
      throw error;
    }
  }
}
