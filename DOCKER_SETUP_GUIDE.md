# Docker Setup and Deployment Guide

## Overview
This guide covers building, testing, and deploying ToolBox using Docker.

## Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- ~2GB free disk space

## Development Environment

### Quick Start
```bash
# Build and start all services
docker-compose up --build

# Backend runs on http://localhost:3000
# Frontend runs on http://localhost:5173
```

### Individual Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean up volumes (WARNING: deletes data)
docker-compose down -v
```

## Production Environment

### Prerequisites
1. Server with Docker and Docker Compose installed
2. Domain name with DNS configured
3. SSL certificate (or use Let's Encrypt via Certbot)
4. Environment variables configured (see .env.example.production)

### Initial Setup
```bash
# Copy environment template
cp .env.example.production .env.production

# Edit with production values
vim .env.production

# Create SSL directory
mkdir -p ssl

# Generate self-signed certificate (for testing only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key \
  -out ssl/certificate.crt \
  -subj "/CN=yourdomain.com"
```

### Deployment

#### Option 1: Using docker-compose
```bash
# Load environment
export $(cat .env.production | xargs)

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Verify services are healthy
docker-compose -f docker-compose.prod.yml ps

# View backend logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

#### Option 2: Kubernetes (Optional)
```bash
# Create namespace
kubectl create namespace toolbox

# Create secrets from .env
kubectl create secret generic toolbox-secrets \
  --from-env-file=.env.production \
  -n toolbox

# Deploy (requires manifests in k8s/ directory)
kubectl apply -f k8s/ -n toolbox
```

### Post-Deployment

#### Database Initialization
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

#### Health Checks
```bash
# Test backend health
curl https://api.yourdomain.com/health

# Test frontend
curl https://yourdomain.com

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

#### Database Backup
```bash
# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U ${DB_USER} ${DB_NAME} < backup_20231104.sql
```

## Image Building

### Local Build
```bash
# Backend
docker build -f docker/Dockerfile.backend -t toolbox-backend:latest .

# Frontend
docker build -f docker/Dockerfile.frontend -t toolbox-frontend:latest .
```

### Push to Registry
```bash
# Tag images
docker tag toolbox-backend:latest ${IMAGE_REGISTRY}/toolbox-backend:latest
docker tag toolbox-frontend:latest ${IMAGE_REGISTRY}/toolbox-frontend:latest

# Push
docker push ${IMAGE_REGISTRY}/toolbox-backend:latest
docker push ${IMAGE_REGISTRY}/toolbox-frontend:latest
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - check postgres health
# 2. Missing environment variables - verify .env file
# 3. Port already in use - change PORT in .env
```

### Frontend not loading
```bash
# Check logs
docker-compose logs frontend

# Verify API connectivity
curl -H "Origin: http://localhost:5173" http://localhost:3000/api/health
```

### Database connection issues
```bash
# Test connection
docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1"

# Check database size
docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME} \
  -c "SELECT pg_size_pretty(pg_database_size('toolbox_db'))"
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Increase container memory if needed (in docker-compose.yml):
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 512M
```

## Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Metrics
```bash
# Real-time resource usage
docker stats

# Container inspect
docker inspect toolbox_backend_prod

# Network
docker network inspect toolbox_backend_network
```

## Security Best Practices

1. **Never commit .env files** - use .env.example as template
2. **Use strong passwords** - minimum 32 characters for secrets
3. **Enable HTTPS** - get SSL cert from Let's Encrypt
4. **Network isolation** - keep databases behind internal networks
5. **Regular backups** - automate database backups
6. **Update images** - rebuild regularly for security patches
7. **Non-root users** - all containers run as non-root

## Scaling

### Horizontal Scaling
```bash
# Scale backend replicas (requires load balancer)
docker-compose up -d --scale backend=3
```

### Database Optimization
```bash
# Enable read replicas in production
# See PostgreSQL documentation for streaming replication
```

## Cleanup

### Remove stopped containers
```bash
docker-compose down
docker system prune
```

### Remove specific image
```bash
docker rmi toolbox-backend:latest
```

### Full cleanup (WARNING: deletes volumes)
```bash
docker-compose down -v
docker system prune -a
```

## Support
- Check logs: `docker-compose logs [service]`
- Verify health: `docker-compose ps`
- Test connectivity: `docker-compose exec [service] curl [url]`
