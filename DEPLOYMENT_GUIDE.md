# Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the ToolBox SaaS platform to production.

## Prerequisites
- Docker & Docker Compose installed
- SSL certificates (Let's Encrypt recommended)
- Stripe account configured
- SendGrid account for email
- PostgreSQL 15+ (or use Docker)
- Redis for caching/sessions
- GitHub repository with Actions configured

## Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Internet Users                        │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx   │ (Reverse Proxy, SSL termination)
                    └────┬────┘
           ┌────────────┬─────────────┐
           │            │             │
      ┌────▼──────┐ ┌──▼────────┐ ┌─▼──────────┐
      │ Frontend  │ │  Backend  │ │   Redis   │
      │ (React)   │ │ (Node.js) │ │ (Cache)   │
      └───────────┘ └────┬─────┘ └──────────┘
                         │
                    ┌────▼─────────┐
                    │ PostgreSQL   │ (Database)
                    └──────────────┘
```

## Pre-Deployment Checklist

- [ ] Environment variables configured (.env.production)
- [ ] SSL certificates obtained (Let's Encrypt or commercial)
- [ ] Database backups configured
- [ ] Stripe API keys configured
- [ ] SendGrid API key configured
- [ ] GitHub Actions secrets configured
- [ ] Docker registry access verified
- [ ] Health check endpoints working
- [ ] Monitoring/logging configured

## Step 1: Prepare Server Infrastructure

### 1.1 Server Requirements
- Ubuntu 22.04 LTS or similar
- Minimum 4GB RAM, 20GB storage
- Docker & Docker Compose
- Nginx
- Certbot (for SSL)

### 1.2 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx

# Install PostgreSQL CLI tools (optional)
sudo apt install -y postgresql-client
```

### 1.3 Create Deployment User
```bash
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo mkdir -p /home/deploy/apps/toolbox
sudo chown -R deploy:deploy /home/deploy/apps
```

## Step 2: Configure SSL/TLS Certificates

### 2.1 Get Let's Encrypt Certificate
```bash
sudo certbot certonly --standalone \
  -d api.example.com \
  -d app.example.com \
  --email admin@example.com \
  --agree-tos \
  --non-interactive
```

### 2.2 Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add: 0 3 * * * /usr/bin/certbot renew --quiet
```

## Step 3: Configure Application

### 3.1 Clone Repository
```bash
cd /home/deploy/apps/toolbox
git clone https://github.com/your-org/toolbox.git .
```

### 3.2 Set Up Environment Variables
```bash
# Copy production env template
cp .env.production.example .env.production

# Edit with production values
nano .env.production

# Key values to update:
# - DATABASE_URL
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - STRIPE_SECRET_KEY
# - SENDGRID_API_KEY
# - All API endpoints
```

### 3.3 Database Setup
```bash
# Create database
createdb -U postgres toolbox_db

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed initial data (if applicable)
docker-compose -f docker-compose.prod.yml exec backend npm run seed:prod
```

## Step 4: Configure Nginx

### 4.1 Create Nginx Configuration
```bash
sudo tee /etc/nginx/sites-available/toolbox > /dev/null << 'EOF'
upstream backend {
    server 127.0.0.1:3000;
}

upstream frontend {
    server 127.0.0.1:3001;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.example.com app.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# API Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
    
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}

# Frontend Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;
    
    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /home/deploy/apps/toolbox/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/toolbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Deploy with Docker Compose

### 5.1 Build Images (or pull from registry)
```bash
cd /home/deploy/apps/toolbox

# Option 1: Pull from registry
docker-compose -f docker-compose.prod.yml pull

# Option 2: Build locally
docker-compose -f docker-compose.prod.yml build
```

### 5.2 Start Services
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify services running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 5.3 Verify Deployment
```bash
# Check backend health
curl -s https://api.example.com/health | jq

# Check frontend
curl -s https://app.example.com | grep "<title>"

# Check database
docker-compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check Redis
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## Step 6: Configure Monitoring & Logging

### 6.1 Application Logs
```bash
# View logs in real-time
docker-compose -f docker-compose.prod.yml logs -f backend

# Logs are also saved to /var/lib/docker/containers/
```

### 6.2 System Monitoring
```bash
# Install Prometheus + Grafana (optional)
docker pull prom/prometheus
docker pull grafana/grafana

# Or use cloud alternatives:
# - AWS CloudWatch
# - Google Cloud Logging
# - Datadog
# - New Relic
```

### 6.3 Error Tracking
```bash
# Configure Sentry in .env.production
SENTRY_DSN=https://your_sentry_dsn

# Application will automatically send errors to Sentry
```

## Step 7: Backup & Recovery

### 7.1 Database Backups
```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U $DB_USER $DB_NAME > backup_$(date +%s).sql

# Automated daily backups (crontab)
0 2 * * * /home/deploy/scripts/backup-database.sh
```

### 7.2 Backup Script
```bash
#!/bin/bash
# /home/deploy/scripts/backup-database.sh

BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%s)
CONTAINER="toolbox_postgres_prod"

mkdir -p $BACKUP_DIR

docker exec $CONTAINER pg_dump -U toolbox_user toolbox_db | \
  gzip > $BACKUP_DIR/toolbox_db_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "toolbox_db_*.sql.gz" -mtime +30 -delete
```

### 7.3 Recovery Procedure
```bash
# Restore from backup
gunzip < backup_xxx.sql.gz | \
  docker-compose -f docker-compose.prod.yml exec -T postgres psql -U toolbox_user toolbox_db
```

## Step 8: Scaling & Performance

### 8.1 Horizontal Scaling
```yaml
# docker-compose.prod.yml - Add backend service replicas
backend:
  deploy:
    replicas: 3  # Run 3 backend instances
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

### 8.2 Load Balancing
```bash
# Update Nginx upstream block for multiple backend instances
upstream backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    least_conn;  # Load balancing algorithm
}
```

### 8.3 Cache Optimization
```bash
# Verify Redis performance
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO stats

# Monitor cache hit ratio
docker-compose -f docker-compose.prod.yml exec redis redis-cli INFO stats | grep keyspace_hits
```

## Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify environment variables
docker-compose -f docker-compose.prod.yml config

# Restart services
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues
```bash
# Test database connection
docker-compose -f docker-compose.prod.yml exec backend \
  node -e "console.log(process.env.DATABASE_URL)"

# Check PostgreSQL is running
docker-compose -f docker-compose.prod.yml exec postgres pg_isready
```

### Memory Issues
```bash
# Check container resource usage
docker stats

# Limit container memory (docker-compose.prod.yml)
resources:
  limits:
    memory: 1G
  reservations:
    memory: 512M
```

### SSL Certificate Issues
```bash
# Check certificate expiry
echo | openssl s_client -servername api.example.com -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Manual renewal
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t
```

## Post-Deployment

- [ ] Health checks passing
- [ ] SSL certificate working
- [ ] Backups configured and tested
- [ ] Monitoring/alerting set up
- [ ] Database replicated/backed up
- [ ] Team trained on deployment process
- [ ] Runbook created for team
- [ ] Incident response plan documented

## Maintenance Windows

### Weekly Tasks
- Review logs and error rates
- Monitor performance metrics
- Verify backups completed successfully

### Monthly Tasks
- SSL certificate check (renewal)
- Database optimization (VACUUM, ANALYZE)
- Review and rotate secrets (if needed)
- Security patches assessment

### Quarterly Tasks
- Disaster recovery drill
- Capacity planning review
- Performance optimization review

## Support & Rollback

### Rollback Procedure
```bash
# Get previous image versions
docker image ls | grep toolbox

# Rollback to previous backend version
docker-compose -f docker-compose.prod.yml down
docker tag ghcr.io/org/toolbox-backend:v1.2.3 ghcr.io/org/toolbox-backend:latest
docker-compose -f docker-compose.prod.yml up -d

# Run migrations if needed (reverse)
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --rolled-back-to=<migration_name>
```

## Emergency Contacts

| Role | Contact | Backup |
|------|---------|--------|
| DevOps Lead | +1-xxx-xxx-xxxx | @backup |
| Database Admin | +1-xxx-xxx-xxxx | @backup |
| Security | security@example.com | - |

