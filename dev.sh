#!/bin/bash

# CSV Converter - Local Development Server Startup Script
# Starts both backend and frontend dev servers locally (without Docker)
# Features: kills existing processes, installs dependencies, manages logs
# Requirements: Node.js 20+, npm

# Exit on error, but allow some commands to fail gracefully
set -E

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3000
FRONTEND_PORT=5173
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
PID_FILE="$LOG_DIR/pids.txt"

# Create logs directory (exit if it fails)
if ! mkdir -p "$LOG_DIR"; then
    echo -e "${RED}[✗]${NC} Failed to create logs directory"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CSV Converter - Development Server Startup                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print colored messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to kill process on specific port
kill_port() {
    local port=$1
    local process_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warn "Found existing process on port $port ($process_name). Killing..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        log_success "Killed process on port $port"
    fi
}

# Function to kill all child processes on exit
cleanup() {
    log_info "Cleaning up processes..."
    
    if [ -f "$PID_FILE" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    log_success "Cleanup complete"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Kill existing processes
log_info "Checking for existing processes..."
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

echo ""
log_info "Setting up backend..."

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    log_info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install --prefer-offline --no-audit
    cd ..
    log_success "Backend dependencies installed"
else
    log_success "Backend dependencies already installed"
fi

# Check if backend build is needed
if [ ! -d "$BACKEND_DIR/dist" ]; then
    log_info "Building backend..."
    cd "$BACKEND_DIR"
    npm run build
    cd ..
    log_success "Backend built successfully"
else
    log_success "Backend already built"
fi

echo ""
log_info "Setting up frontend..."

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log_info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install --prefer-offline --no-audit
    cd ..
    log_success "Frontend dependencies installed"
else
    log_success "Frontend dependencies already installed"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting servers...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Start backend
log_info "Starting backend server (http://localhost:$BACKEND_PORT)..."
cd "$BACKEND_DIR"

# Check if npm run dev script exists
if ! grep -q '"dev"' package.json; then
    log_error "Backend package.json missing 'dev' script"
    exit 1
fi

# Create log file first
touch "$BACKEND_LOG"
npm run dev > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
touch "$PID_FILE"
echo $BACKEND_PID >> "$PID_FILE"

# Give backend time to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    log_error "Backend failed to start. Check $BACKEND_LOG for details:"
    cat "$BACKEND_LOG"
    exit 1
fi

log_success "Backend started (PID: $BACKEND_PID)"
cd ..

# Start frontend
log_info "Starting frontend server (http://localhost:$FRONTEND_PORT)..."
cd "$FRONTEND_DIR"

# Check if npm run dev script exists
if ! grep -q '"dev"' package.json; then
    log_error "Frontend package.json missing 'dev' script"
    kill $BACKEND_PID || true
    exit 1
fi

# Create log file first
touch "$FRONTEND_LOG"
npm run dev > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID >> "$PID_FILE"

# Give frontend time to start
sleep 2

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    log_error "Frontend failed to start. Check $FRONTEND_LOG for details:"
    cat "$FRONTEND_LOG"
    kill $BACKEND_PID || true
    exit 1
fi

log_success "Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Development servers are running!                          ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:${BACKEND_PORT}${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Logs:${NC}"
echo -e "${GREEN}║    Backend:  $BACKEND_LOG${NC}"
echo -e "${GREEN}║    Frontend: $FRONTEND_LOG${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop all servers${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Monitor both processes
log_info "Monitoring servers..."

while true; do
    # Check if backend is still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "Backend process died! Stopping frontend..."
        kill $FRONTEND_PID 2>/dev/null || true
        
        echo ""
        log_error "Backend logs:"
        tail -20 "$BACKEND_LOG"
        exit 1
    fi
    
    # Check if frontend is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        log_error "Frontend process died! Stopping backend..."
        kill $BACKEND_PID 2>/dev/null || true
        
        echo ""
        log_error "Frontend logs:"
        tail -20 "$FRONTEND_LOG"
        exit 1
    fi
    
    sleep 5
done
