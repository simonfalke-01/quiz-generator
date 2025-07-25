# Docker Setup for Quiz Platform

This document describes how to run the Quiz Platform using Docker and Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- Caddy network created (for reverse proxy setup)

## Quick Start

### 1. Create the Caddy Network

If you haven't already created the external Caddy network:

```bash
docker network create caddy_net
```

### 2. Environment Variables

Copy your environment variables to a `.env` file:

```bash
cp .env.example .env
```

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key for quiz generation
- `AWS_ACCESS_KEY_ID` - AWS credentials for file storage
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., us-east-1)
- `REDIS_URL` - Redis connection URL (optional)

### 3. Build and Run

```bash
# Build and start the containers
docker compose up --build -d

# View logs
docker compose logs -f quiz-platform

# Stop the containers
docker compose down
```

### 4. Access the Application

- **Direct access**: http://localhost:8000
- **Via Caddy proxy**: http://quiz.localhost (if Caddy is configured)

## Health Check

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

## Docker Configuration

### Dockerfile Features

- **Base Image**: `oven/bun:1` for optimal Bun support
- **Multi-stage build**: Optimized for production
- **Non-root user**: Runs as `nextjs` user for security
- **Health check**: Built-in container health monitoring
- **Port**: Exposes port 8000

### Compose Configuration

- **Service**: `quiz-platform`
- **Network**: `caddy_net` (external)
- **Volume**: `quiz_data` for persistent storage
- **Health check**: HTTP check on `/api/health`
- **Restart policy**: `unless-stopped`

## Caddy Integration

The compose file includes Caddy labels for automatic reverse proxy setup:

```yaml
labels:
  - "caddy=quiz.localhost"
  - "caddy.reverse_proxy={{upstreams 8000}}"
```

This automatically configures Caddy to proxy `quiz.localhost` to the container.

## Development

For development with Docker:

```bash
# Build only
docker compose build

# Run with rebuild
docker compose up --build

# Shell into container
docker compose exec quiz-platform sh

# View container logs
docker compose logs -f quiz-platform
```

## Troubleshooting

### Container Won't Start

1. Check logs: `docker compose logs quiz-platform`
2. Verify environment variables are set
3. Ensure port 8000 is not in use
4. Check network exists: `docker network ls | grep caddy_net`

### Health Check Failing

1. Verify the container is running: `docker compose ps`
2. Check health endpoint manually: `curl http://localhost:8000/api/health`
3. Review application logs for errors

### File Upload Issues

1. Ensure AWS credentials are properly set
2. Check S3 bucket permissions
3. Verify network connectivity from container

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Configure proper secrets management
3. Set up monitoring and logging
4. Configure backup for the `quiz_data` volume
5. Use HTTPS with proper SSL certificates

## Security Considerations

- The container runs as a non-root user
- Environment variables should be properly secured
- Consider using Docker secrets for sensitive data
- Regular updates of base images and dependencies