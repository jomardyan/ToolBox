# ToolBox Dev Environment - Quick Start Guide

## ✅ Status: All Services Running

Your ToolBox development environment is now fully operational!

## 🚀 Quick Start

### Open in Browser
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api-docs

### Demo Login Credentials

| Role  | Email | Password |
|-------|-------|----------|
| Admin | `admin@demo.com` | `Demo@12345` |
| User  | `user@demo.com` | `Demo@12345` |

## 📊 Services Status

```
✅ Backend      | http://localhost:3000  | Node.js + TypeScript
✅ Frontend     | http://localhost:5173  | Vite + React + TypeScript
✅ Database     | SQLite                 | /backend/prisma/dev.db
✅ Health Check | Both services passing   | Ready for development
```

## 🔧 Service Management

### Start Environment
```bash
cd /home/jomardyan/Dev/ToolBox
./dev.sh
```

### Stop Services
```bash
# Press Ctrl+C in the terminal running dev.sh
```

### View Logs
```bash
# Backend logs
tail -f /home/jomardyan/Dev/ToolBox/logs/backend.log

# Frontend logs
tail -f /home/jomardyan/Dev/ToolBox/logs/frontend.log
```

## 🔗 Common API Endpoints

### Public Endpoints (No Auth Required)
```bash
# Health check
curl http://localhost:3000/health

# API health
curl http://localhost:3000/api/health

# Convert file (example)
curl -X POST http://localhost:3000/api/convert \
  -F "file=@input.csv" \
  -F "outputFormat=json"
```

### Protected Endpoints (Auth Required)
```bash
# Login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@12345"}'

# Get current user
curl -b cookies.txt http://localhost:3000/api/auth/me

# Get usage quota
curl -b cookies.txt http://localhost:3000/api/user/usage/quota

# Get API keys
curl -b cookies.txt http://localhost:3000/api/user/api-keys
```

## 📝 Recent Fixes

1. ✅ Fixed health check to try multiple endpoints and hosts
2. ✅ Increased health check timeout to 90 seconds
3. ✅ Fixed frontend API URL configuration with `/api` prefix
4. ✅ Fixed authentication persistence with session verification
5. ✅ Relaxed rate limits for development (1000 req/min)
6. ✅ Improved Node.js version management via nvm

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Kill any stuck processes
pkill -9 -f "nodemon|vite|ts-node"

# Check if ports are free
lsof -i :3000
lsof -i :5173

# Restart dev environment
./dev.sh
```

### Authentication Not Persisting
1. Clear browser cookies for `localhost:5173`
2. Clear browser local storage
3. Try login again
4. Check backend logs for refresh token errors (expected on first login)

### API Endpoints Returning 429 (Too Many Requests)
- Rate limits are set to 1000 req/min in development
- If this still happens, check `backend/src/app.ts` for rate limiting config

### Frontend Not Loading
1. Verify Vite is running: `curl http://localhost:5173`
2. Check frontend logs: `tail -f logs/frontend.log`
3. Verify Node.js version: `node --version` (should be 24.x+)

## 📚 Important Files

| File | Purpose |
|------|---------|
| `dev.sh` | Main development startup script |
| `backend/.env.development` | Backend environment variables |
| `frontend/.env.local` | Frontend environment variables |
| `.env` | Shared configuration (DATABASE_URL, etc) |
| `backend/prisma/schema.prisma` | Database schema |
| `logs/backend.log` | Backend application logs |
| `logs/frontend.log` | Frontend build and server logs |

## 🔐 Security Notes for Development

- Use `localhost` or `127.0.0.1` only in development
- Demo credentials should never be used in production
- Don't commit `.env` files with real API keys
- Rate limiting is relaxed for development; tighten for production

## 📖 Full Documentation

See `/Docs/DEV_ENVIRONMENT_FIXES.md` for complete technical details including:
- All changes made to fix issues
- Verification steps
- Known limitations
- Advanced troubleshooting

## 🎯 What's Next?

1. **Start Dev Environment**: Run `./dev.sh`
2. **Open Frontend**: Navigate to http://localhost:5173
3. **Login**: Use admin@demo.com / Demo@12345
4. **Test Conversion**: Try converting a file
5. **Check API Docs**: Visit http://localhost:3000/api-docs

---

**Last Updated**: November 6, 2025
**Status**: ✅ All systems operational
**Support**: Check logs and documentation if issues arise
