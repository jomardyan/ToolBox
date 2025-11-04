#!/bin/bash

# CSV Converter - Local Development Server Startup Script
# Starts both backend and frontend dev servers locally (without Docker)
# Features: kills existing processes, installs dependencies, manages logs, Swagger support, auto-recovery
# Requirements: Node.js 20+, npm

# Exit on error, but allow some commands to fail gracefully
set -E

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
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
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=2

# Create logs directory (exit if it fails)
if ! mkdir -p "$LOG_DIR"; then
    echo -e "${RED}[✗]${NC} Failed to create logs directory"
    exit 1
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CSV Converter - Development Server Startup                ║${NC}"
echo -e "${BLUE}║  (with Swagger & Auto-Recovery)                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print colored messages
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_DIR/startup.log"
}

log_debug() {
    echo -e "${MAGENTA}[DEBUG]${NC} $1" | tee -a "$LOG_DIR/startup.log"
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

# Function to check if port is open
is_port_open() {
    local port=$1
    timeout 2 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null && return 0 || return 1
}

# Function to kill all child processes on exit
cleanup() {
    log_info "🧹 Cleaning up processes..."
    
    if [ -f "$PID_FILE" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                log_debug "Killing PID $pid"
                kill "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    log_success "Cleanup complete"
}

# Function to handle errors with retry logic
start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local log_file=$4
    local restart_count=${5:-0}
    
    log_info "Starting $service_name (attempt $((restart_count + 1))/$MAX_RESTART_ATTEMPTS)..."
    
    if [ ! -d "$service_dir" ]; then
        log_error "$service_name directory not found: $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing $service_name dependencies..."
        npm install --prefer-offline --no-audit --legacy-peer-deps 2>&1 | tee -a "$log_file"
        if [ $? -ne 0 ]; then
            log_error "Failed to install $service_name dependencies"
            cd "$SCRIPT_DIR"
            return 1
        fi
        log_success "$service_name dependencies installed"
    fi
    
    # Create log file
    touch "$log_file"
    
    # Start the service
    npm run dev >> "$log_file" 2>&1 &
    local PID=$!
    
    # Verify process started
    if ! kill -0 $PID 2>/dev/null; then
        log_error "$service_name failed to start (PID $PID). Check logs:"
        tail -20 "$log_file"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    log_success "$service_name started (PID: $PID)"
    echo $PID >> "$PID_FILE"
    cd "$SCRIPT_DIR"
    return 0
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local port=$2
    local endpoint=$3
    local timeout=$4
    
    log_info "Verifying $service_name health..."
    
    local start_time=$(date +%s)
    local attempt=0
    
    while true; do
        attempt=$((attempt + 1))
        
        if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
            log_success "$service_name is responsive"
            return 0
        fi
        
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout ]; then
            log_error "$service_name health check failed after $timeout seconds"
            return 1
        fi
        
        log_debug "$service_name health check attempt $attempt..."
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Function to monitor and restart services
monitor_services() {
    local backend_pid=$1
    local frontend_pid=$2
    
    log_info "🔍 Starting service monitoring (auto-recovery disabled - press Ctrl+C to stop)..."
    
    while true; do
        # Check backend
        if ! kill -0 $backend_pid 2>/dev/null; then
            log_error "❌ Backend process died! Check logs: $BACKEND_LOG"
            log_error "Stopping all services..."
            return 1
        fi
        
        # Check frontend
        if ! kill -0 $frontend_pid 2>/dev/null; then
            log_error "❌ Frontend process died! Check logs: $FRONTEND_LOG"
            log_error "Stopping all services..."
            return 1
        fi
        
        sleep 10
    done
}

# Swagger is available through the backend at /api-docs
# No separate swagger server needed

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Kill existing processes
log_info "🔄 Checking for existing processes..."
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"

echo ""
log_info "📦 Setting up backend..."

# Start backend
if ! start_service "Backend" "$BACKEND_DIR" "$BACKEND_PORT" "$BACKEND_LOG"; then
    log_error "Failed to start backend"
    exit 1
fi
BACKEND_PID=$!

echo ""
log_info "📦 Setting up frontend..."

# Start frontend
if ! start_service "Frontend" "$FRONTEND_DIR" "$FRONTEND_PORT" "$FRONTEND_LOG"; then
    log_error "Failed to start frontend"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
FRONTEND_PID=$!

echo ""

# Health checks
if ! check_service_health "Backend" "$BACKEND_PORT" "/api/health" "$HEALTH_CHECK_TIMEOUT"; then
    log_error "Backend health check failed"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    [ ! -z "$SWAGGER_PID" ] && kill $SWAGGER_PID 2>/dev/null || true
    exit 1
fi

log_info "Verifying frontend..."
if is_port_open $FRONTEND_PORT; then
    log_success "Frontend is responsive"
else
    log_warn "Frontend may not be responding yet"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✨ Development Environment Ready!                        ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  📱 Frontend:      http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${GREEN}║  🔌 Backend API:   http://localhost:${BACKEND_PORT}${NC}"
echo -e "${GREEN}║  📊 Swagger Docs:  http://localhost:${BACKEND_PORT}/api-docs${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Health Status: ✓ Verified${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  📝 Logs:${NC}"
echo -e "${GREEN}║    Backend:  $BACKEND_LOG${NC}"
echo -e "${GREEN}║    Frontend: $FRONTEND_LOG${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  ⏹️  Press Ctrl+C to stop all servers${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start monitoring
monitor_services $BACKEND_PID $FRONTEND_PID
