#!/bin/bash

# VoltAgent Demo Setup Test Script
# This script verifies that the demo setup is working correctly

set -e

echo "🚀 VoltAgent Demo Setup Test"
echo "=============================="

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

# Check if Docker is running
echo "Checking Docker..."
if docker info > /dev/null 2>&1; then
    print_status "Docker is running" 0
else
    print_status "Docker is not running" 1
    exit 1
fi

# Check if Docker Compose is available
echo "Checking Docker Compose..."
if docker-compose --version > /dev/null 2>&1; then
    print_status "Docker Compose is available" 0
else
    print_status "Docker Compose is not available" 1
    exit 1
fi

# Check if .env file exists
echo "Checking environment configuration..."
if [ -f ".env" ]; then
    print_status ".env file exists" 0
else
    echo -e "${YELLOW}⚠️  .env file not found. Please copy .env.example to .env and configure it.${NC}"
    if [ -f ".env.example" ]; then
        print_status ".env.example file exists" 0
    else
        print_status ".env.example file not found" 1
        exit 1
    fi
fi

# Check if required directories exist
echo "Checking project structure..."
directories=("services/node-service" "services/fastapi-service" ".github/workflows" "monitoring")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        print_status "Directory $dir exists" 0
    else
        print_status "Directory $dir missing" 1
    fi
done

# Check if required files exist
echo "Checking required files..."
files=("docker-compose.yml" "README.md" "services/node-service/package.json" "services/fastapi-service/requirements.txt")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_status "File $file exists" 0
    else
        print_status "File $file missing" 1
    fi
done

echo ""
echo "🎉 Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure your API_KEY"
echo "2. Run: docker-compose up --build"
echo "3. Test the services with the curl commands in README.md"
echo ""
echo "For more information, see README.md"
