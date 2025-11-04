# Production Deployment Guide

## Pre-Deployment Checklist

- [ ] Environment configured (.env.production filled with all required values)
- [ ] Database backups tested
- [ ] SSL certificate obtained and verified
- [ ] DNS records configured
- [ ] GitHub Actions secrets configured
- [ ] Monitoring and alerting set up
- [ ] Load balancer/reverse proxy configured
- [ ] Security audit completed
- [ ] Stakeholders notified

## Environment Setup

### 1. Server Requirements
- Ubuntu 20.04 LTS or newer
- Minimum 2 CPU cores, 4GB RAM
- 20GB+ storage for data
- Outbound HTTPS access for external APIs (Stripe, email, etc.)

### 2. Install Dependencies
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. SSL Certificate

#### Using Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com -d www.yourdomain.com

# Setup auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### Manual Certificate
```bash
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key \
  -out ssl/certificate.crt
```

## Deployment Process

### Step 1: Clone and Configure
```bash
# Clone repository
cd /home && sudo git clone https://github.com/yourusername/ToolBox.git toolbox
cd /home/toolbox

# Configure environment
sudo cp .env.example.production .env.production
sudo nano .env.production
# Fill in all production values

# Set proper permissions
sudo chown -R $USER:$USER /home/toolbox
chmod 600 .env.production
```

### Step 2: Prepare Directories
```bash
# Create necessary directories
mkdir -p logs backups ssl data

# Set permissions
chmod 700 logs backups ssl data
```

### Step 3: Database Initialization
```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# (Optional) Seed with initial data
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Step 4: Deploy Application
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl http://localhost:3000/health
curl http://localhost:80/
```

### Step 5: Configure Reverse Proxy

Create `/etc/nginx/sites-available/toolbox`:
```nginx
upstream backend {
    server 127.0.0.1:3000;
}

upstream frontend {
    server 127.0.0.1:80;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com api.yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# API subdomain
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Backend API
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/toolbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Post-Deployment Verification

### Health Checks
```bash
# Frontend
curl -I https://yourdomain.com

# API
curl -I https://api.yourdomain.com/health

# Database
docker-compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

### Smoke Tests
```bash
# Register user
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Verify UI loads
curl -s https://yourdomain.com | head -20
```

## Monitoring and Maintenance

### Log Monitoring
```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Rotate logs
docker-compose -f docker-compose.prod.yml logs --timestamps backend | tail -1000

# Archive old logs
tar -czf logs/archived-$(date +%Y%m%d).tar.gz logs/backend.log
```

### Resource Monitoring
```bash
# CPU and Memory usage
docker stats

# Disk usage
df -h
du -sh /home/toolbox/*

# Database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U $DB_USER \
  -c "SELECT pg_size_pretty(pg_database_size('toolbox_db'))"
```

### Database Maintenance
```bash
# Weekly backups
docker-compose -f docker-compose.prod.yml exec postgres pg_dump \
  -U $DB_USER $DB_NAME > /home/toolbox/backups/db-backup-$(date +%Y%m%d-%H%M%S).sql

# Compress old backups
find /home/toolbox/backups -name "*.sql" -mtime +7 -exec gzip {} \;

# Cleanup very old backups (keep 30 days)
find /home/toolbox/backups -name "*.sql.gz" -mtime +30 -delete
```

### Update Process
```bash
# Pull latest changes
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Zero-downtime deploy
docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker-compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

## Troubleshooting

### Application not responding
```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### Database connection errors
```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres psql \
  -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check environment variables
docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE
```

### High memory usage
```bash
# Check container stats
docker stats

# Increase container memory limit
# Edit docker-compose.prod.yml and add:
# deploy:
#   resources:
#     limits:
#       memory: 1G
#
# Then: docker-compose -f docker-compose.prod.yml up -d
```

## Disaster Recovery

### Database Restore
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql \
  -U $DB_USER $DB_NAME < backups/db-backup-20231104-120000.sql

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Complete System Recovery
```bash
# Remove all containers and volumes
docker-compose -f docker-compose.prod.yml down -v

# Restore from backup
mkdir -p recovery
tar -xzf backups/full-backup-20231104.tar.gz -C recovery/

# Redeploy
docker-compose -f docker-compose.prod.yml up -d
```

## Security Hardening

### Firewall Rules
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### User Management
```bash
# Create app user
sudo useradd -m -s /bin/bash toolbox
sudo usermod -aG docker toolbox

# Setup SSH keys (disable password auth)
sudo su - toolbox
mkdir ~/.ssh
# Add your public key to ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Regular Updates
```bash
# Create weekly update cron job
0 2 * * 0 cd /home/toolbox && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_billing_records_user_date ON billing_records(user_id, created_at);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### Caching Strategy
- Redis for session storage
- Browser caching via HTTP headers
- CDN for static assets

### Load Balancing (Optional)
```bash
# Deploy multiple backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Configure load balancer (nginx or HAProxy)
```

## Support and Escalation

- **Critical Issues**: Page on-call engineer
- **High Priority**: Create GitHub issue + notify team
- **Medium Priority**: Create GitHub issue
- **Low Priority**: Document and schedule for next sprint

---

**Last Updated**: November 4, 2025
**Version**: 1.0.0
**Maintainer**: DevOps Team
