# Production Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **Strong JWT Secrets** - Generate with: `openssl rand -base64 32`
2. **Database** - PostgreSQL 15+ with connection pooling
3. **Redis** - For session management and caching
4. **SMTP Server** - For email notifications
5. **Stripe Account** - For payment processing
6. **Domain & SSL** - HTTPS is required
7. **Monitoring** - Sentry or similar error tracking

## Environment Variables

Copy `.env.example` to `.env.production` and configure:

### Critical (Application will not start without these)

```bash
# Generate strong secrets (minimum 32 characters)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# Database connection
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public&connection_limit=20

# Redis for caching
REDIS_URL=redis://:password@host:6379
```

### Required for Full Functionality

```bash
# Email configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com

# Stripe payment processing
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL for CORS and email links
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Optional but Recommended

```bash
# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info

# OAuth (if using social login)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Pre-Deployment Checklist

### Security

- [ ] Generate strong random JWT secrets (min 32 chars)
- [ ] Ensure JWT_SECRET ≠ JWT_REFRESH_SECRET
- [ ] Configure CORS origins to only allowed domains
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (allow only 80/443)
- [ ] Set up database user with least privileges
- [ ] Enable database SSL connections
- [ ] Configure rate limiting appropriately
- [ ] Review and update security headers

### Database

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Create database backups schedule
- [ ] Configure connection pooling (20-50 connections)
- [ ] Set up read replicas for scaling
- [ ] Enable slow query logging
- [ ] Create indexes for frequently queried fields

### Monitoring

- [ ] Configure error tracking (Sentry)
- [ ] Set up application metrics (Prometheus/Grafana)
- [ ] Configure log aggregation (ELK/CloudWatch)
- [ ] Set up uptime monitoring (Pingdom/UptimeRobot)
- [ ] Configure alerting for critical errors
- [ ] Set up APM (Application Performance Monitoring)

### Infrastructure

- [ ] Configure load balancer with health checks
- [ ] Set up auto-scaling policies
- [ ] Configure CDN for static assets
- [ ] Enable compression (gzip/brotli)
- [ ] Set up Redis for caching and sessions
- [ ] Configure backup and disaster recovery
- [ ] Document rollback procedures

## Deployment Steps

### 1. Build the Application

```bash
# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Using Docker (Recommended)

```bash
# Build production image
docker build -f docker/Dockerfile.backend -t toolbox-api:latest .

# Run with docker-compose
docker-compose -f docker/docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker/docker-compose.prod.yml logs -f backend
```

### 3. Manual Deployment

```bash
# Set environment
export NODE_ENV=production

# Start application with PM2 (process manager)
pm2 start dist/index.js --name toolbox-api -i max

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

## Post-Deployment Verification

### Health Checks

```bash
# Basic health check
curl https://yourdomain.com/health

# API documentation
curl https://yourdomain.com/api-docs/json

# Check database connection
curl https://yourdomain.com/api/health
```

### Load Testing

```bash
# Install k6
brew install k6  # or appropriate package manager

# Run load test
k6 run load-test.js
```

### Security Scan

```bash
# Run security audit
npm audit

# Check for vulnerabilities
npx snyk test

# SSL/TLS configuration test
nmap --script ssl-enum-ciphers -p 443 yourdomain.com
```

## Monitoring Endpoints

- **Health**: `GET /health`
- **Metrics**: `GET /metrics` (if enabled)
- **API Docs**: `GET /api-docs`

## Scaling Considerations

### Horizontal Scaling

- Deploy multiple instances behind a load balancer
- Use Redis for shared session storage
- Configure sticky sessions if needed
- Ensure stateless application design

### Database Scaling

- Use connection pooling (configured in DATABASE_URL)
- Set up read replicas for read-heavy operations
- Implement caching with Redis
- Use database indexes for common queries
- Archive old data regularly

### Caching Strategy

```
User Sessions: Redis (TTL: 7 days)
API Responses: Redis (TTL: 5 minutes)
Static Assets: CDN (TTL: 1 year)
Database Queries: Redis (TTL: varies)
```

## Performance Targets

- **Response Time**: p95 < 200ms, p99 < 500ms
- **Throughput**: 1000 req/sec per instance
- **Error Rate**: < 0.1%
- **Uptime**: 99.9% (8.76 hours downtime/year)

## Troubleshooting

### Application Won't Start

1. Check environment variables: `printenv | grep JWT`
2. Verify database connection: `psql $DATABASE_URL`
3. Check logs: `pm2 logs toolbox-api` or `docker logs`
4. Verify ports are available: `lsof -i :3000`

### High Response Times

1. Check database query performance
2. Review rate limiting configuration
3. Check Redis connection
4. Monitor CPU and memory usage
5. Review application logs for slow operations

### Authentication Issues

1. Verify JWT secrets are set correctly
2. Check token expiration times
3. Verify CORS configuration
4. Review authentication logs

## Rollback Procedure

```bash
# Using Docker
docker-compose -f docker/docker-compose.prod.yml down
docker pull toolbox-api:previous-version
docker-compose -f docker/docker-compose.prod.yml up -d

# Using PM2
pm2 stop toolbox-api
# Deploy previous version
pm2 start dist/index.js --name toolbox-api
pm2 save
```

## Maintenance

### Regular Tasks

- **Daily**: Review error logs and metrics
- **Weekly**: Check for security updates, review performance
- **Monthly**: Update dependencies, review access logs
- **Quarterly**: Full security audit, disaster recovery test

### Database Maintenance

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Vacuum database
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('dbname'));"
```

## Support & Emergency Contacts

- **On-Call Engineer**: [Contact info]
- **Database Admin**: [Contact info]
- **DevOps Team**: [Contact info]
- **Security Team**: [Contact info]

## Additional Resources

- [API Documentation](https://yourdomain.com/api-docs)
- [Prisma Migrate Guide](https://www.prisma.io/docs/guides/migrate)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Production Checklist](https://github.com/goldbergyoni/nodebestpractices)
