#!/bin/bash
set -e

echo "Starting CloneWriter Docker Container..."

# Start Ollama in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Ollama failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Pull the model if not already present
echo "Checking for llama3.2:1b model..."
if ! ollama list | grep -q "llama3.2:1b"; then
    echo "Pulling llama3.2:1b model (this may take a few minutes)..."
    ollama pull llama3.2:1b
    echo "Model pulled successfully!"
else
    echo "Model already exists, skipping pull."
fi

# Stop the background Ollama (supervisor will manage it)
kill $OLLAMA_PID 2>/dev/null || true
wait $OLLAMA_PID 2>/dev/null || true

echo "Starting services with supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
