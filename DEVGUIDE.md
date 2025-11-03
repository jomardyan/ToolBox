# CSV Converter - Development Guide

## Quick Start

### Easiest Method: Use the Dev Script

```bash
./dev.sh
```

This single command will:
- ✅ Kill any existing processes on ports 3000 and 5173
- ✅ Install dependencies (if not already installed)
- ✅ Build the backend
- ✅ Start backend dev server (http://localhost:3000)
- ✅ Start frontend dev server (http://localhost:5173)
- ✅ Monitor both processes and restart if they crash

**Output**: Colored logs with status indicators and process IDs

### Alternative: Using npm Scripts

From the root directory:

```bash
# Start both servers
npm run dev:all

# Or start them separately
npm run dev:backend    # Terminal 1
npm run dev:frontend   # Terminal 2
```

### Manual Setup

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## Available Commands

### Development

| Command | Purpose |
|---------|---------|
| `npm run dev:all` | Start both backend and frontend |
| `npm run dev:backend` | Start only backend |
| `npm run dev:frontend` | Start only frontend |
| `./dev.sh` | Start all with process management |

### Building

| Command | Purpose |
|---------|---------|
| `npm run build:all` | Build both backend and frontend |
| `npm run install:all` | Install all dependencies |

### Testing & Linting

| Command | Purpose |
|---------|---------|
| `npm run test:backend` | Run backend tests |
| `npm run lint:backend` | Run ESLint |

### Docker

| Command | Purpose |
|---------|---------|
| `npm run docker:up` | Start containers |
| `npm run docker:down` | Stop containers |

### Cleanup

| Command | Purpose |
|---------|---------|
| `npm run clean` | Remove all build artifacts and node_modules |
| `npm run clean:logs` | Remove log files |

---

## Access Points

Once running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*

---

## Using the Dev Script

### How It Works

1. **Process Cleanup**
   - Checks for existing processes on ports 3000 and 5173
   - Kills them gracefully with 1 second delay

2. **Dependency Installation**
   - Installs npm packages only if needed
   - Uses offline cache when available

3. **Backend Setup**
   - Checks if TypeScript build exists
   - Builds if necessary: `npm run build`
   - Starts dev server: `npm run dev`

4. **Frontend Setup**
   - Installs dependencies if needed
   - Starts Vite dev server: `npm run dev`

5. **Monitoring**
   - Continuously checks both processes
   - Automatically stops all if one crashes
   - Shows detailed logs on failure

### Log Files

Logs are saved in the `logs/` directory:

```
logs/
├── backend.log   # Backend server logs
├── frontend.log  # Frontend server logs
└── pids.txt      # Process IDs (for cleanup)
```

View logs while running:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

### Stopping Servers

Press `Ctrl+C` to stop all servers. The script will:
- Kill both backend and frontend processes
- Clean up PID files
- Remove logs (optional)

---

## Troubleshooting

### "Port 3000 already in use"

The script handles this automatically, but if you need manual cleanup:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### "npm: command not found"

Install Node.js 20+ from https://nodejs.org

### Backend won't start

Check logs:
```bash
tail logs/backend.log
cd backend && npm run build
```

### Frontend won't start

Check logs:
```bash
tail logs/frontend.log
cd frontend && npm install
```

### API connection refused

- Ensure backend is running: `curl http://localhost:3000/api/health`
- Check backend logs for errors
- Verify CORS settings in backend

### Hot reload not working

- Frontend: Restart `npm run dev:frontend`
- Backend: Should auto-reload with nodemon (check logs)

---

## Development Workflow

### Making Changes

**Backend**:
1. Edit TypeScript files in `backend/src/`
2. Server auto-reloads via nodemon
3. Check logs for errors

**Frontend**:
1. Edit React files in `frontend/src/`
2. Browser auto-refreshes via Vite HMR
3. No build step needed for development

### Testing Changes

```bash
# Test backend
npm run test:backend

# Test specific converter
cd backend && npm test -- csvToJson
```

### Debugging

**Backend**:
- Enable debug logs: `DEBUG=csv-converter:* npm run dev:backend`
- Check `logs/backend.log`
- Use Chrome DevTools for Node (port 9229)

**Frontend**:
- Open browser DevTools (F12)
- Check console and Network tabs
- Hot Module Reload shows in console

---

## Performance Tips

### Development

1. **Keep dev script running** for auto-reload
2. **Check logs regularly** for warnings
3. **Run tests** before committing: `npm run test:backend`

### Optimization

```bash
# Profile backend
npm run dev:backend -- --profile

# Check bundle size
cd frontend && npm run build
```

---

## Requirements

- **Node.js**: 20.0.0 or higher
- **npm**: 9.0.0 or higher
- **Ports**: 3000 (backend), 5173 (frontend) must be available

Check versions:
```bash
node --version
npm --version
```

---

## Files & Configuration

### Backend Config

- `backend/package.json` - Dependencies and scripts
- `backend/tsconfig.json` - TypeScript configuration
- `backend/.env` - Environment variables (optional)

### Frontend Config

- `frontend/package.json` - Dependencies and scripts
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/vite.config.ts` - Vite configuration

### Scripts Config

- `dev.sh` - Development server startup
- `package.json` - Root npm scripts

---

## Next Steps

- 📚 Read `DOCUMENTATION.md` for full project documentation
- 🧪 Run tests: `npm run test:backend`
- 🐳 Try Docker: `npm run docker:up`
- 🚀 Build for production: `npm run build:all`

---

## Support

For detailed project information, see `DOCUMENTATION.md`.

For issues with the dev script, check:
1. Node.js version (must be 20+)
2. Port availability
3. Log files in `logs/` directory
4. Existing processes on ports 3000 and 5173
