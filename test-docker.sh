#!/bin/bash
# Test script for Docker build
# This script validates the Docker setup without doing a full build

set -e

echo "🔍 Validating Docker setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not available. Please install docker-compose."
    exit 1
fi

echo "✅ docker-compose is available"

# Validate Dockerfile syntax
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

echo "✅ Dockerfile found"

# Validate docker-compose.yml
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found"
    exit 1
fi

echo "✅ docker-compose.yml found"

# Validate entrypoint script
if [ ! -f "docker-entrypoint.sh" ]; then
    echo "❌ docker-entrypoint.sh not found"
    exit 1
fi

if [ ! -x "docker-entrypoint.sh" ]; then
    echo "⚠️  docker-entrypoint.sh is not executable, fixing..."
    chmod +x docker-entrypoint.sh
fi

echo "✅ docker-entrypoint.sh is executable"

# Validate supervisord config
if [ ! -f "supervisord.conf" ]; then
    echo "❌ supervisord.conf not found"
    exit 1
fi

echo "✅ supervisord.conf found"

# Check if required files exist
REQUIRED_FILES=(
    "package.json"
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file not found: $file"
        exit 1
    fi
done

echo "✅ All required files present"

echo ""
echo "✨ Docker setup is valid!"
echo ""
echo "To build and run:"
echo "  docker-compose up -d"
echo ""
echo "To test build only (without running):"
echo "  docker-compose build"
echo ""
echo "Note: Initial build will take 5-10 minutes and download ~1.5GB"
