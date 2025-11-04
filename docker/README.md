# Docker Configuration

This directory contains all Docker-related files for the ToolBox application.

## Files

### Dockerfiles

- **Dockerfile.backend** - Production backend image
  - Multi-stage build for optimized size
  - Builds TypeScript, runs compiled JavaScript
  - Exposes port 3000

- **Dockerfile.backend.dev** - Development backend image
  - Runs TypeScript directly with ts-node
  - Includes nodemon for auto-reload
  - Exposes port 3000

- **Dockerfile.frontend** - Production frontend image
  - Multi-stage build for optimized size
  - Builds React/Vite application
  - Serves static files with `serve`
  - Exposes port 5173

- **Dockerfile.frontend.dev** - Development frontend image
  - Runs Vite dev server
  - Hot module reloading enabled
  - Exposes port 5173

## Docker Compose

The root `docker-compose.yml` uses these Dockerfiles:

```bash
# Start development environment
docker-compose up

# Start in background
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build
```

## Building Images Manually

### Backend Production Image
```bash
docker build -f docker/Dockerfile.backend -t csv-backend:latest .
docker run -p 3000:3000 csv-backend:latest
```

### Backend Development Image
```bash
docker build -f docker/Dockerfile.backend.dev -t csv-backend:dev .
docker run -p 3000:3000 csv-backend:dev
```

### Frontend Production Image
```bash
docker build -f docker/Dockerfile.frontend -t csv-frontend:latest .
docker run -p 5173:5173 csv-frontend:latest
```

### Frontend Development Image
```bash
docker build -f docker/Dockerfile.frontend.dev -t csv-frontend:dev .
docker run -p 5173:5173 csv-frontend:dev
```

## Environment Configuration

Services can be configured via environment variables in `docker-compose.yml`:

### Backend
- `NODE_ENV` - Set to 'development' or 'production'
- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

### Frontend
- `VITE_API_URL` - Backend API URL (default: http://localhost:3000/api)

## Optimization

The `.dockerignore` file optimizes build context and prevents unnecessary files from being copied into images:

- `node_modules/` - Using npm ci in Dockerfile
- `.git/` - Not needed in images
- `.env.local` - Development configuration only
- `dist/` and `build/` - Rebuilt in Dockerfile
- `logs/` - Generated at runtime
- Test files and coverage - Not needed in production

## Networking

Services communicate via the `csv-network` bridge network:
- Backend is accessible from frontend as `http://backend:3000`
- Frontend is accessible at `http://localhost:5173`
- Both accessible from host at configured ports

## Production Deployment

For production deployment:

1. Use production Dockerfiles (without `.dev` suffix)
2. Set `NODE_ENV=production`
3. Use external configuration management (secrets, env vars)
4. Consider using Docker Swarm or Kubernetes orchestration
5. Set up proper logging and monitoring

## Troubleshooting

**Port already in use?**
```bash
docker-compose down
# or kill specific containers
docker kill <container_id>
```

**Need to rebuild?**
```bash
docker-compose build --no-cache
docker-compose up
```

**Check logs?**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Access running container?**
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
```

---

For more information, see the main [DOCUMENTATION.md](../DOCUMENTATION.md)
