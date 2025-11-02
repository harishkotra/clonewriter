# CloneWriter - Docker Deployment Guide

This guide explains how to run CloneWriter in a Docker container with Ollama included for fully local inference.

## Features

- 🐳 **Single Container**: Both Next.js app and Ollama in one container
- 🔒 **100% Local**: No external API calls, fully self-contained
- 📦 **Pre-configured**: Uses llama3.2:1b model (lightweight, fast)
- 🔄 **Auto-restart**: Automatic service recovery
- 💾 **Data Persistence**: Volumes for vector store and uploads

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The app will be available at http://localhost:3000

### Using Docker CLI

```bash
# Build the image
docker build -t clonewriter:latest .

# Run the container
docker run -d \
  --name clonewriter \
  -p 3000:3000 \
  -p 11434:11434 \
  -v $(pwd)/vector_store:/app/vector_store \
  -v $(pwd)/data/uploads:/app/data/uploads \
  -v ollama_models:/root/.ollama \
  clonewriter:latest

# View logs
docker logs -f clonewriter

# Stop the container
docker stop clonewriter
docker rm clonewriter
```

## First Run

On the first run, the container will:
1. Start Ollama server
2. Pull the llama3.2:1b model (~1.3GB download)
3. Start the Next.js app

**Initial startup takes 2-5 minutes** depending on your internet speed.

## Resource Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 5GB free space
- **Network**: Required for initial model download

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB
- **Disk**: 10GB free space

## Configuration

### Environment Variables

You can customize the container with environment variables:

```yaml
# docker-compose.yml
environment:
  - NODE_ENV=production
  - OLLAMA_HOST=http://localhost:11434
  - OLLAMA_MODEL=llama3.2:1b  # Change model here
  - PORT=3000
  - HOSTNAME=0.0.0.0
```

### Available Models

You can change the model by updating `OLLAMA_MODEL` environment variable:

| Model | Size | RAM Required | Speed | Quality |
|-------|------|--------------|-------|---------|
| llama3.2:1b | 1.3GB | 2GB | Very Fast | Good |
| llama3.2:3b | 2.0GB | 4GB | Fast | Better |
| llama3.1:8b | 4.7GB | 8GB | Medium | Excellent |
| llama3.1:70b | 40GB | 64GB | Slow | Best |

**Note**: Larger models require more RAM and take longer to generate content.

## Data Persistence

The following directories are persisted as volumes:

- `/app/vector_store` - Your writing samples and embeddings
- `/app/data/uploads` - Uploaded files
- `/root/.ollama` - Ollama models (saves re-downloading)

### Backup Your Data

```bash
# Backup vector store
docker cp clonewriter:/app/vector_store ./backup/vector_store

# Backup uploads
docker cp clonewriter:/app/data/uploads ./backup/uploads
```

### Restore Data

```bash
# Restore vector store
docker cp ./backup/vector_store clonewriter:/app/vector_store

# Restore uploads
docker cp ./backup/uploads clonewriter:/app/data/uploads
```

## Monitoring

### Health Check

The container includes a health check that verifies:
- Next.js app is responding
- Ollama is running

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' clonewriter
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Ollama logs only
docker exec clonewriter tail -f /var/log/supervisor/ollama.out.log

# Next.js logs only
docker exec clonewriter tail -f /var/log/supervisor/nextjs.out.log
```

### Resource Usage

```bash
# View CPU and memory usage
docker stats clonewriter
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Common issues:
# 1. Not enough RAM - increase Docker memory limit
# 2. Port already in use - change port in docker-compose.yml
# 3. Model download failed - check internet connection
```

### Ollama Not Responding

```bash
# Check if Ollama is running
docker exec clonewriter curl http://localhost:11434/api/tags

# Restart Ollama
docker exec clonewriter supervisorctl restart ollama
```

### Out of Memory

```bash
# Check memory usage
docker stats clonewriter

# Solutions:
# 1. Use a smaller model (llama3.2:1b)
# 2. Increase Docker memory limit
# 3. Reduce max_tokens in generation settings
```

### Model Download Failed

```bash
# Manually pull model
docker exec -it clonewriter ollama pull llama3.2:1b

# Check available models
docker exec clonewriter ollama list
```

## Deployment Options

### Deploy to Cloud

#### DigitalOcean App Platform
```bash
# Push to GitHub
git push origin main

# Connect repository in DigitalOcean dashboard
# Select Dockerfile deployment
# Set resource size: Professional (8GB RAM recommended)
```

#### AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URL
docker tag clonewriter:latest YOUR_ECR_URL/clonewriter:latest
docker push YOUR_ECR_URL/clonewriter:latest

# Deploy via ECS console or CLI
```

#### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Deploy
fly deploy
```

### Self-Hosted

#### Docker Swarm
```bash
docker stack deploy -c docker-compose.yml clonewriter
```

#### Kubernetes
```bash
# Convert docker-compose to k8s
kompose convert -f docker-compose.yml

# Apply manifests
kubectl apply -f .
```

## Security Considerations

### For Production

1. **Use HTTPS**: Run behind a reverse proxy (nginx, Caddy)
2. **Authentication**: Add auth middleware if needed
3. **Rate Limiting**: Protect API endpoints
4. **Update Regularly**: Keep base image and dependencies updated

### Example with Caddy

```yaml
# docker-compose.yml
services:
  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - clonewriter
```

```
# Caddyfile
yourdomain.com {
    reverse_proxy clonewriter:3000
}
```

## Performance Optimization

### CPU Optimization
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '4'  # Increase for faster inference
```

### Memory Optimization
```yaml
# Use smaller model
environment:
  - OLLAMA_MODEL=llama3.2:1b
```

### Storage Optimization
```bash
# Clean old models
docker exec clonewriter ollama rm old_model_name

# Remove unused volumes
docker volume prune
```

## Updating

### Update the App

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Update the Model

```bash
# Pull new model
docker exec clonewriter ollama pull llama3.2:3b

# Update environment variable in docker-compose.yml
# Restart container
docker-compose restart
```

## Uninstallation

```bash
# Stop and remove container
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Remove image
docker rmi clonewriter:latest
```

## Support

- **Issues**: Report bugs on GitHub
- **Logs**: Always include logs when reporting issues
- **Performance**: Share your hardware specs for optimization help

---

Built with ❤️ for 100% local and private AI writing assistance!
