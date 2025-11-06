# 🚀 dev.sh - Complete Development Script Guide

## Overview

The `dev.sh` script provides a **zero-configuration development environment** that works seamlessly on:
- ✅ Local VS Code
- ✅ GitHub Codespaces
- ✅ VS Code Remote Containers
- ✅ WSL (Windows Subsystem for Linux)
- ✅ Linux/macOS

## 🎯 Quick Start

```bash
bash dev.sh
```

That's it! The script will:
1. Auto-install Node.js if missing
2. Install all dependencies
3. Setup SQLite database with demo data
4. Start backend and frontend servers
5. Display clickable URLs

## ✨ Features

### Automatic Installation
- **Node.js 18+**: Installed via nvm or system package manager
- **System Tools**: curl, git, build-essential (if needed)
- **Dependencies**: npm packages for backend and frontend
- **Database**: SQLite with Prisma schema and demo users

### Environment Detection
The script automatically detects:
- 🌐 GitHub Codespaces
- 🐳 VS Code Remote Containers
- 🪟 WSL (Windows Subsystem for Linux)
- 💻 Local environment

### Smart Port Management
- Kills existing processes on ports 3000 and 5173
- Configures port visibility in Codespaces
- Works with local firewall settings

### Health Checks
- Verifies backend API is responsive
- Checks frontend server availability
- Monitors services continuously

## 📋 Command Line Options

### Basic Usage
```bash
# Normal startup
bash dev.sh

# Fresh start (reset database)
bash dev.sh --reset

# Skip database setup
bash dev.sh --skip-db

# Skip dependency installation
bash dev.sh --skip-deps

# Show help
bash dev.sh --help
```

### Options Explained

| Option | Description |
|--------|-------------|
| `--reset` | Deletes existing database and starts fresh with new demo data |
| `--skip-db` | Skips database initialization (useful if DB is already setup) |
| `--skip-deps` | Skips dependency installation (fails if Node.js not found) |
| `--help`, `-h` | Shows help message with usage examples |

## 🔧 What It Does

### 1. System Requirements Check
```
[▶] System Requirements Check
[✓] Node.js v22.20.0 detected
[✓] npm 10.9.3 detected
💻 Running in local environment
```

- Checks for Node.js 18+
- If missing, attempts automatic installation via:
  1. Existing nvm installation
  2. Installing nvm + Node.js 18
  3. System package manager (dnf, apt-get, etc.)
- Verifies npm is available
- Detects and installs system tools (curl, git, gcc)

### 2. Project Structure Verification
```
[▶] Verifying Project Structure
[✓] Project structure verified
```

- Checks for backend/ and frontend/ directories
- Verifies package.json files exist
- Ensures project is properly setup

### 3. Port Cleanup
```
[▶] Cleaning Up Existing Processes
[✓] Ports cleared
```

- Kills any processes using port 3000 (backend)
- Kills any processes using port 5173 (frontend)
- Ensures clean startup

### 4. Dependency Installation
```
[▶] Installing Dependencies
[INFO] Backend dependencies not found, installing...
[✓] Backend dependencies installed
[✓] Frontend dependencies up to date
```

- Installs backend npm packages
- Installs frontend npm packages
- Uses `--prefer-offline` and `--no-audit` for faster installs
- Only reinstalls if package.json changed

### 5. Database Setup
```
[▶] Database Setup
[INFO] Generating Prisma client...
[✓] Prisma client generated
[✓] Database already exists
[✓] Database schema is up to date
[✓] Demo users verified
```

- Generates Prisma client
- Creates SQLite database (if doesn't exist)
- Applies schema with `prisma db push`
- Seeds demo users:
  - **Admin**: admin@demo.com / Demo@12345
  - **User**: user@demo.com / Demo@12345

### 6. Start Services
```
[▶] Starting Backend Service
[INFO] Starting Backend on port 3000...
[✓] Backend started (PID: 12345)

[▶] Starting Frontend Service
[INFO] Starting Frontend on port 5173...
[✓] Frontend started (PID: 12346)
```

- Starts backend with `npm run dev`
- Starts frontend with `npm run dev`
- Logs output to `logs/backend.log` and `logs/frontend.log`
- Tracks PIDs for proper cleanup

### 7. Health Checks
```
[▶] Health Checks
[INFO] Verifying Backend health...
[✓] Backend is responsive
[✓] Frontend is responsive
```

- Checks backend `/api/health` endpoint
- Verifies frontend port is open
- Waits up to 45 seconds for services to start

### 8. Success Banner
```
╔═══════════════════════════════════════════════════════════════════╗
║  ✨ Development Environment Ready! (Local)                       ║
╠═══════════════════════════════════════════════════════════════════╣
║  🌐 Server URLs:                                                  ║
║    📱 Frontend:  http://localhost:5173                           ║
║    🔌 Backend:   http://localhost:3000                           ║
║    📊 API Docs:  http://localhost:3000/api-docs                  ║
╠═══════════════════════════════════════════════════════════════════╣
║  👤 Demo Credentials:                                             ║
║    Admin: admin@demo.com / Demo@12345                            ║
║    User:  user@demo.com / Demo@12345                             ║
╠═══════════════════════════════════════════════════════════════════╣
║  📝 Logs:                                                         ║
║    Backend:  tail -f logs/backend.log                            ║
║    Frontend: tail -f logs/frontend.log                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  ⏹️  Press Ctrl+C to stop all servers                             ║
╚═══════════════════════════════════════════════════════════════════╝

🔗 Click to open:
   Frontend:  http://localhost:5173
   Backend:   http://localhost:3000
   API Docs:  http://localhost:3000/api-docs
```

## 🌐 URLs in Different Environments

### Local VS Code
```
Frontend:  http://localhost:5173
Backend:   http://localhost:3000
API Docs:  http://localhost:3000/api-docs
```

### GitHub Codespaces
```
Frontend:  https://username-reponame-5173.preview.app.github.dev
Backend:   https://username-reponame-3000.preview.app.github.dev
API Docs:  https://username-reponame-3000.preview.app.github.dev/api-docs
```

The URLs are **clickable** in VS Code terminal - just Ctrl+Click (or Cmd+Click on Mac) to open in browser!

## 📁 Project Structure

```
ToolBox/
├── dev.sh                    # This script
├── backend/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   └── setup-db.ts
│   └── src/
├── frontend/
│   ├── package.json
│   └── src/
└── logs/
    ├── backend.log           # Backend server logs
    ├── frontend.log          # Frontend server logs
    ├── startup.log           # Script execution logs
    └── pids.txt             # Process IDs
```

## 🛠️ Troubleshooting

### Node.js Not Installing
```bash
# Manual installation with nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18
```

### Ports Already in Use
The script automatically kills processes on ports 3000 and 5173. If manual intervention is needed:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Services Not Starting
Check the logs:
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Startup logs
tail -f logs/startup.log
```

### Database Issues
Reset the database:
```bash
bash dev.sh --reset
```

This will:
- Delete existing database
- Recreate schema
- Seed fresh demo data

### Permission Issues
If you get permission errors when installing Node.js:
```bash
# Use nvm (doesn't require sudo)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
```

## 🔄 Stopping the Servers

Press `Ctrl+C` in the terminal running dev.sh. The script will:
1. Gracefully shut down both servers
2. Kill any remaining processes
3. Clean up PID files
4. Display cleanup confirmation

## 📊 Service Monitoring

The script continuously monitors services every 10 seconds:
- Checks if processes are still running
- Verifies ports are still open
- Logs health status every minute
- Exits if all services stop

## 🎨 Customization

### Change Ports
Edit the `dev.sh` script:
```bash
# Ports
BACKEND_PORT=3000   # Change to your preferred port
FRONTEND_PORT=5173  # Change to your preferred port
```

### Adjust Timeouts
```bash
# Timeouts
HEALTH_CHECK_TIMEOUT=45       # How long to wait for services
HEALTH_CHECK_INTERVAL=2       # How often to check
SERVICE_START_WAIT=3          # Wait after starting service
```

## 🔐 Demo Credentials

The script creates two demo users:

### Admin Account
- **Email**: admin@demo.com
- **Password**: Demo@12345
- **Permissions**: Full admin access

### Regular User
- **Email**: user@demo.com
- **Password**: Demo@12345
- **Permissions**: Standard user access

## 📝 Logs

All logs are stored in the `logs/` directory:

| File | Content |
|------|---------|
| `startup.log` | Script execution and setup logs |
| `backend.log` | Backend server output |
| `frontend.log` | Frontend server output |
| `pids.txt` | Process IDs for running services |

## 🚨 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (missing files, failed installations, etc.) |

## 💡 Tips

1. **Use in VS Code Terminal**: The URLs are clickable - just Ctrl+Click to open
2. **Keep Terminal Open**: The script monitors services and shows live status
3. **Check Logs**: If something goes wrong, check `logs/startup.log` first
4. **Fresh Start**: Use `--reset` flag to start with clean database
5. **Speed Up Startup**: Use `--skip-db` if database is already setup

## 🤝 Integration with VS Code

### Tasks
The script can be added to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Environment",
      "type": "shell",
      "command": "bash dev.sh",
      "isBackground": true,
      "problemMatcher": []
    }
  ]
}
```

### Launch Configuration
Can be used with VS Code debugger (attach mode).

## 📦 What Gets Installed

### Node.js Packages (Backend)
- Express.js
- Prisma
- TypeScript
- And all dependencies from backend/package.json

### Node.js Packages (Frontend)
- React/Vue/Angular (depending on your frontend)
- Vite
- And all dependencies from frontend/package.json

### System Tools (if missing)
- curl or wget
- git
- gcc/build-essential (for native modules)

## 🎯 Best Practices

1. **First Time Setup**: Just run `bash dev.sh` and let it install everything
2. **Daily Development**: Run `bash dev.sh` to start your environment
3. **After Git Pull**: The script auto-detects package.json changes
4. **Clean State**: Use `--reset` if you encounter database issues
5. **Production**: Do NOT use this script in production (it's dev-only)

## 🌟 Advanced Usage

### Background Mode (Not Recommended)
```bash
nohup bash dev.sh > /tmp/dev-output.log 2>&1 &
```

### With tmux/screen
```bash
tmux new -s dev
bash dev.sh
# Detach with Ctrl+B then D
```

### Docker Integration
The script works inside Docker containers too, just ensure:
- Container has bash
- Has permission to install packages (if needed)
- Ports are properly mapped

## 📞 Support

If you encounter issues:
1. Check `logs/startup.log` for errors
2. Verify Node.js 18+ is installed: `node -v`
3. Ensure ports 3000 and 5173 are available
4. Check project structure is intact
5. Try with `--reset` flag

---

**Made with ❤️ for seamless development experience**
