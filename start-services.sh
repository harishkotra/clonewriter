#!/bin/bash

# CloneWriter Service Starter Script
# This script helps you start all required services for CloneWriter

echo "🚀 Starting CloneWriter Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama is not installed${NC}"
    echo "Please install Ollama from https://ollama.ai/"
    exit 1
fi

# Check if ChromaDB is installed
if ! command -v chroma &> /dev/null && ! python3 -c "import chromadb" &> /dev/null; then
    echo -e "${RED}❌ ChromaDB is not installed${NC}"
    echo "Install it with: pip install chromadb"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites are installed${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -i :$1 &> /dev/null
}

# Start Ollama if not running
echo "1️⃣  Checking Ollama..."
if check_port 11434; then
    echo -e "${GREEN}✓ Ollama is already running${NC}"
else
    echo -e "${YELLOW}Starting Ollama...${NC}"
    ollama serve &> /dev/null &
    OLLAMA_PID=$!
    sleep 2
    echo -e "${GREEN}✓ Ollama started (PID: $OLLAMA_PID)${NC}"
fi

# Check if a model is pulled
echo ""
echo "2️⃣  Checking Ollama models..."
if ollama list | grep -q "llama"; then
    echo -e "${GREEN}✓ Model found${NC}"
else
    echo -e "${YELLOW}No model found. Pulling llama3.2:3b...${NC}"
    ollama pull llama3.2:3b
    echo -e "${GREEN}✓ Model pulled${NC}"
fi

# Start ChromaDB if not running
echo ""
echo "3️⃣  Checking ChromaDB..."
if check_port 8000; then
    echo -e "${GREEN}✓ ChromaDB is already running${NC}"
else
    echo -e "${YELLOW}Starting ChromaDB...${NC}"
    mkdir -p vector_store
    chroma run --path ./vector_store &> /dev/null &
    CHROMA_PID=$!
    sleep 2
    echo -e "${GREEN}✓ ChromaDB started (PID: $CHROMA_PID)${NC}"
fi

# Check if node_modules exists
echo ""
echo "4️⃣  Checking Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Start Next.js
echo ""
echo "5️⃣  Starting CloneWriter app..."
echo -e "${GREEN}✓ Opening http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

npm run dev
