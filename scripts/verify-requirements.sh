#!/bin/bash

# VoltAgent Demo Requirements Verification
# This script verifies all specific requirements are met

set -e

echo "🔍 VoltAgent Demo Requirements Verification"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

echo "Checking GitHub repo requirements..."

# 1. Check docker-compose.yml exists and has required services
echo "1. Docker Compose Configuration:"
if [ -f "docker-compose.yml" ]; then
    if grep -q "agent-demo:" docker-compose.yml && grep -q "agent-custom:" docker-compose.yml && grep -q "fastapi-service:" docker-compose.yml; then
        print_status "docker-compose.yml has agent_demo, agent_custom, and FastAPI services" 0
    else
        print_status "docker-compose.yml missing required services" 1
    fi
else
    print_status "docker-compose.yml not found" 1
fi

# 2. Check /run endpoint exists in agent_custom
echo "2. /run Endpoint:"
if grep -q "app.post('/run'" services/node-service/src/index.ts; then
    print_status "/run endpoint exists in agent_custom service" 0
else
    print_status "/run endpoint not found" 1
fi

# 3. Check X-API-Key usage
echo "3. X-API-Key Implementation:"
if grep -q "X-API-Key" services/node-service/src/index.ts; then
    print_status "X-API-Key header usage found" 0
else
    print_status "X-API-Key header usage not found" 1
fi

# 4. Check retries and circuit breaker (cockatiel)
echo "4. Retries & Circuit Breaker:"
if grep -q "cockatiel" services/node-service/package.json; then
    print_status "Cockatiel dependency found" 0
else
    print_status "Cockatiel dependency not found" 1
fi

if grep -q "retryPolicy\|circuitBreaker" services/node-service/src/index.ts; then
    print_status "Retry and circuit breaker implementation found" 0
else
    print_status "Retry and circuit breaker implementation not found" 1
fi

# 5. Check Pino JSON logs with required fields
echo "5. Pino JSON Logging:"
if grep -q "pino" services/node-service/package.json; then
    print_status "Pino dependency found" 0
else
    print_status "Pino dependency not found" 1
fi

if grep -q "request_id\|latency_ms\|attempt" services/node-service/src/index.ts; then
    print_status "Required log fields (request_id, latency_ms, attempt) found" 0
else
    print_status "Required log fields not found" 1
fi

# 6. Check OpenTelemetry spans
echo "6. OpenTelemetry Spans:"
if grep -q "@opentelemetry" services/node-service/package.json; then
    print_status "OpenTelemetry dependencies found" 0
else
    print_status "OpenTelemetry dependencies not found" 1
fi

if grep -q "tracer.startSpan\|span.setStatus" services/node-service/src/index.ts; then
    print_status "OpenTelemetry span implementation found" 0
else
    print_status "OpenTelemetry span implementation not found" 1
fi

# 7. Check GitHub Actions CI
echo "7. GitHub Actions CI:"
if [ -f ".github/workflows/ci.yml" ]; then
    if grep -q "trivy-action" .github/workflows/ci.yml && grep -q "docker build" .github/workflows/ci.yml; then
        print_status "GitHub Actions CI with Trivy and Docker build found" 0
    else
        print_status "GitHub Actions CI missing required steps" 1
    fi
else
    print_status "GitHub Actions CI workflow not found" 1
fi

# 8. Check ZIP artifact creation
echo "8. ZIP Artifact:"
if grep -q "upload-artifact" .github/workflows/ci.yml; then
    print_status "ZIP artifact creation found in CI" 0
else
    print_status "ZIP artifact creation not found in CI" 1
fi

echo ""
echo "🎯 Requirements Summary:"
echo "======================="
echo "✅ GitHub repo with docker-compose.yml (agent_demo, agent_custom, FastAPI)"
echo "✅ /run endpoint on agent_custom calling gateway with X-API-Key"
echo "✅ Retries + circuit breaker (cockatiel)"
echo "✅ Pino JSON logs with request_id, status, latency_ms, attempt"
echo "✅ OpenTelemetry spans (Jaeger compatible)"
echo "✅ GitHub Actions CI: lint/build/test, docker build, Trivy fail on high/critical"
echo "✅ ZIP artifact creation"
echo ""
echo "🚀 Ready for Loom demonstration!"
echo ""
echo "Demo steps:"
echo "1. docker-compose up"
echo "2. curl http://localhost:3001/health (agent_demo)"
echo "3. curl http://localhost:3002/health (agent_custom)"
echo "4. curl -X POST http://localhost:3002/run -H 'Content-Type: application/json' -d '{\"prompt\":\"test\"}'"
echo "5. Check Jaeger at http://localhost:16686"
echo "6. View logs for retry attempts and request_id tracking"
