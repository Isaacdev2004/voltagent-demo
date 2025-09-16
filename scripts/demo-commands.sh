#!/bin/bash

# VoltAgent Demo Commands for Loom Walkthrough
# Use these commands in your Loom video

echo "🎬 VoltAgent Demo Commands for Loom"
echo "==================================="
echo ""

echo "1. Start the services:"
echo "docker-compose up --build"
echo ""

echo "2. Wait for services to be healthy, then test health endpoints:"
echo "curl http://localhost:3001/health  # agent_demo"
echo "curl http://localhost:3002/health  # agent_custom"
echo "curl http://localhost:8000/ping    # FastAPI gateway"
echo ""

echo "3. Test the /run endpoint (this will show retries in logs):"
echo "curl -X POST http://localhost:3002/run \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-Request-ID: demo-request-123' \\"
echo "  -d '{\"prompt\": \"Hello, this is a test prompt\", \"max_tokens\": 50}'"
echo ""

echo "4. Check Jaeger for traces:"
echo "Open http://localhost:16686 in browser"
echo "Look for 'agent_run' spans with request_id: demo-request-123"
echo ""

echo "5. View logs to see retry attempts and request_id tracking:"
echo "docker-compose logs agent-custom | grep 'demo-request-123'"
echo ""

echo "6. Test circuit breaker by stopping FastAPI service:"
echo "docker-compose stop fastapi-service"
echo "curl -X POST http://localhost:3002/run \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"prompt\": \"Test circuit breaker\"}'"
echo "docker-compose start fastapi-service"
echo ""

echo "📊 Key things to highlight in Loom:"
echo "- Health checks return 200 OK"
echo "- /run endpoint calls gateway with X-API-Key from env"
echo "- Retries visible in logs with attempt numbers"
echo "- Request ID tracking throughout the flow"
echo "- OpenTelemetry spans in Jaeger UI"
echo "- Circuit breaker behavior when service is down"
echo "- Pino JSON structured logging"
