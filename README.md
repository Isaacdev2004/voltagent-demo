# VoltAgent Demo

A comprehensive demonstration of multi-service system integration showcasing Docker Compose, CI/CD pipelines, logging, retries, circuit breakers, and observability.

## 🏗️ Architecture

This demo consists of multiple microservices working together:

- **FastAPI Service** (Python) - Backend API gateway with authentication
- **Node.js Demo Agent** (TypeScript) - Agent runtime with AutoGen.js patterns
- **Node.js Custom Agent** (TypeScript) - Custom agent implementation
- **Jaeger** - Distributed tracing
- **Prometheus** - Metrics collection
- **Grafana** - Metrics visualization

## 📂 Project Structure

```
voltagent-demo/
├── services/
│   ├── node-service/           # TypeScript + Node.js agent runtime
│   │   ├── src/
│   │   │   ├── index.ts        # Main application entry point
│   │   │   ├── utils/          # Utility modules
│   │   │   │   ├── logger.ts   # Structured logging with Pino
│   │   │   │   ├── tracing.ts  # OpenTelemetry setup
│   │   │   │   └── resilience.ts # Retry & circuit breaker policies
│   │   │   └── services/       # Service modules
│   │   │       ├── fastapi-client.ts
│   │   │       └── health-service.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── fastapi-service/        # Python FastAPI backend
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── monitoring/                 # Observability configuration
│   ├── prometheus.yml
│   └── grafana/
├── docker-compose.yml
├── .github/workflows/ci.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd voltagent-demo
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Required: Change the API key
API_KEY=your-secure-api-key-here

# Optional: Customize ports
NODE_PORT_DEMO=3001
NODE_PORT_CUSTOM=3002
FASTAPI_PORT=8000
```

### 3. Start Services

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 4. Verify Services

Check that all services are healthy:

```bash
# Check service status
docker-compose ps

# Test FastAPI service
curl http://localhost:8000/ping

# Test Node.js demo agent
curl http://localhost:3001/health

# Test Node.js custom agent
curl http://localhost:3002/health
```

## 🔧 Service Endpoints

### FastAPI Service (Port 8000)

- `GET /ping` - Health check
- `POST /completions` - AI completions (requires X-API-Key header)
- `GET /health` - Detailed health status

### Node.js Demo Agent (Port 3001)

- `GET /health` - Health check
- `POST /completions` - Proxy to FastAPI with retry logic
- `POST /agent/demo` - Demo agent processing

### Node.js Custom Agent (Port 3002)

- `GET /health` - Health check
- `POST /completions` - Proxy to FastAPI with retry logic
- `POST /agent/demo` - Custom agent processing

## 🧪 Testing the Demo

### 1. Test Completions Endpoint

```bash
curl -X POST http://localhost:8000/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-here" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

### 2. Test Agent Demo

```bash
curl -X POST http://localhost:3001/agent/demo \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need help with a task"
  }'
```

### 3. Test Retry Logic

The Node.js services implement exponential backoff retry (3-5 attempts) and circuit breaker patterns using Cockatiel. You can observe this by:

1. Stopping the FastAPI service: `docker-compose stop fastapi-service`
2. Making requests to the Node.js services
3. Observing retry attempts in the logs
4. Restarting FastAPI: `docker-compose start fastapi-service`

## 📊 Observability

### Jaeger Tracing

Access Jaeger UI at: http://localhost:16686

- View distributed traces across services
- Analyze request flow and timing
- Debug performance bottlenecks

### Prometheus Metrics

Access Prometheus at: http://localhost:9090

- View service metrics
- Create custom queries
- Set up alerts

### Grafana Dashboards

Access Grafana at: http://localhost:3000

- Username: `admin`
- Password: `admin`
- Pre-configured dashboards for service monitoring

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:

### Lint & Test Job
- Node.js dependency installation and linting
- Python dependency installation and linting
- TypeScript compilation
- Unit tests (when implemented)

### Build & Security Scan Job
- Docker image building for all services
- Trivy vulnerability scanning
- SARIF report upload to GitHub Security tab

### Integration Test Job
- Full Docker Compose deployment
- Health check verification
- API endpoint testing
- Service interaction validation

### Deploy Job (Main Branch Only)
- Staging deployment (placeholder)
- Production deployment pipeline

## 🛡️ Security Features

- **API Key Authentication** - All sensitive endpoints require valid API keys
- **Container Security** - Non-root users in all containers
- **Vulnerability Scanning** - Automated Trivy scans in CI/CD
- **Secrets Management** - Environment variables for sensitive data
- **CORS Configuration** - Proper cross-origin resource sharing setup

## 🔧 Development

### Local Development

```bash
# Node.js service development
cd services/node-service
npm install
npm run dev

# FastAPI service development
cd services/fastapi-service
pip install -r requirements.txt
uvicorn main:app --reload
```

### Adding New Features

1. **New Endpoints**: Add routes to the respective service files
2. **New Services**: Create new service directory and update `docker-compose.yml`
3. **New Dependencies**: Update `package.json` or `requirements.txt`
4. **Configuration**: Add new environment variables to `.env.example`

### Logging

All services use structured JSON logging:

- **Node.js**: Pino logger with pretty printing in development
- **FastAPI**: Python logging with JSON formatting
- **Log Levels**: Configurable via `LOG_LEVEL` environment variable

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Change ports in `.env` file
2. **API Key Errors**: Ensure `API_KEY` is set in `.env`
3. **Service Unavailable**: Check `docker-compose ps` for unhealthy services
4. **Build Failures**: Run `docker-compose build --no-cache`

### Debug Commands

```bash
# View service logs
docker-compose logs [service-name]

# Check service health
docker-compose ps

# Restart specific service
docker-compose restart [service-name]

# Rebuild and restart
docker-compose up --build [service-name]
```

## 📈 Performance

### Retry Configuration
- **Exponential Backoff**: 100ms initial delay, 2s max delay
- **Max Attempts**: 5 retries
- **Circuit Breaker**: Opens after 5 failures, 30s half-open period

### Resource Limits
- **Memory**: Services monitor memory usage (500MB warning threshold)
- **CPU**: No explicit limits (adjustable in docker-compose.yml)
- **Network**: Services communicate via internal Docker network

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure CI/CD pipeline passes
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **AutoGen.js** - Agent framework inspiration
- **Cockatiel** - Resilience patterns
- **OpenTelemetry** - Observability standards
- **FastAPI** - Modern Python web framework
- **Docker** - Containerization platform
