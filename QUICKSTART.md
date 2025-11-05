# Quick Start Guide

## 🚀 One-Command Setup

```bash
bash dev.sh
```

That's it! This will:
- ✅ Check system requirements (Node.js, npm)
- ✅ Install all dependencies
- ✅ Set up SQLite database with demo data
- ✅ Configure Codespaces ports (if applicable)
- ✅ Start backend (port 3000)
- ✅ Start frontend (port 5173)
- ✅ Run health checks

## 📋 Demo Credentials

After setup completes, log in with:

**Admin Account:**
- Email: `admin@demo.com`
- Password: `Demo@12345`

**Regular User:**
- Email: `user@demo.com`
- Password: `Demo@12345`

## 🎯 Common Commands

```bash
# Normal startup
bash dev.sh

# Fresh start (reset database)
bash dev.sh --reset

# Skip database setup
bash dev.sh --skip-db

# Skip dependency check
bash dev.sh --skip-deps

# Get help
bash dev.sh --help
```

## 🔧 Troubleshooting

### Services won't start
```bash
# Kill any stuck processes
pkill -f "node.*3000"
pkill -f "node.*5173"

# Try again
bash dev.sh
```

### Database issues
```bash
# Reset everything
bash dev.sh --reset
```

### View logs
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Startup logs
tail -f logs/startup.log
```

## 📍 Access URLs

### Local Development
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### GitHub Codespaces
URLs are automatically detected and displayed on startup.
Typically:
- Frontend: https://[codespace]-5173.app.github.dev
- Backend: https://[codespace]-3000.app.github.dev

## 🛠️ Manual Setup (if needed)

If you prefer to run services separately:

```bash
# Backend
cd backend
npm install
npm run dev:setup  # First time only
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## ⚡ Features

- **Auto-dependency management**: Installs missing packages automatically
- **Database initialization**: SQLite with demo users on first run
- **Hot reload**: Both servers watch for changes
- **Health checks**: Verifies services are responding
- **Graceful shutdown**: Ctrl+C cleanly stops all services
- **Codespaces support**: Auto-detects and configures ports
- **Comprehensive logging**: Separate logs for each service

## 📚 Learn More

- [Full Development Setup Guide](DEV_SETUP.md)
- [API Documentation](http://localhost:3000/api-docs) (after starting)
