#!/bin/bash

# ToolBox - Complete Development Environment Setup & Startup Script
# 
# This script provides a comprehensive development environment setup including:
# - Dependency management (Node.js, npm, system packages)
# - Database initialization (SQLite with demo data)
# - Port configuration (GitHub Codespaces support)
# - Process management (graceful shutdown, health checks)
# - Logging and monitoring
#
# Requirements: Node.js 18+, npm
# Usage: bash dev.sh [--reset] [--skip-db] [--help]

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# ============================================
# Configuration
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
STARTUP_LOG="$LOG_DIR/startup.log"
PID_FILE="$LOG_DIR/pids.txt"

# Ports
BACKEND_PORT=3000
FRONTEND_PORT=5173

# Timeouts
HEALTH_CHECK_TIMEOUT=45
HEALTH_CHECK_INTERVAL=2
SERVICE_START_WAIT=3

# Flags
RESET_DB=false
SKIP_DB=false
SKIP_DEPS=false

# ============================================
# Parse Command Line Arguments
# ============================================

while [[ $# -gt 0 ]]; do
  case $1 in
    --reset)
      RESET_DB=true
      shift
      ;;
    --skip-db)
      SKIP_DB=true
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --help|-h)
      echo "ToolBox Development Environment Setup"
      echo ""
      echo "Usage: bash dev.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --reset       Reset database and start fresh"
      echo "  --skip-db     Skip database initialization"
      echo "  --skip-deps   Skip dependency installation"
      echo "  --help, -h    Show this help message"
      echo ""
      echo "Examples:"
      echo "  bash dev.sh              # Normal startup"
      echo "  bash dev.sh --reset      # Fresh start with new database"
      echo "  bash dev.sh --skip-db    # Skip database setup"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run 'bash dev.sh --help' for usage information"
      exit 1
      ;;
  esac
done

# Create logs directory
mkdir -p "$LOG_DIR" || {
    echo -e "${RED}[✗]${NC} Failed to create logs directory"
    exit 1
}

# Clear old logs
> "$STARTUP_LOG"

# ============================================
# Display Banner
# ============================================

clear
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BOLD}ToolBox - Development Environment Setup${NC}              ${CYAN}║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  SQLite Dev DB • Auto Dependencies • Health Checks       ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# Logging Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$STARTUP_LOG"
}

log_step() {
    echo -e "${CYAN}[▶]${NC} ${BOLD}$1${NC}" | tee -a "$STARTUP_LOG"
}

log_debug() {
    if [ "$DEBUG" = "true" ]; then
        echo -e "${MAGENTA}[DEBUG]${NC} $1" | tee -a "$STARTUP_LOG"
    fi
}

# ============================================
# System Check Functions
# ============================================

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

check_node_version() {
    if check_command node; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            log_success "Node.js $(node -v) detected"
            return 0
        else
            log_error "Node.js version $node_version is too old (need 18+)"
            return 1
        fi
    else
        log_error "Node.js not found"
        return 1
    fi
}

check_npm() {
    if check_command npm; then
        log_success "npm $(npm -v) detected"
        return 0
    else
        log_error "npm not found"
        return 1
    fi
}

detect_codespaces() {
    if [ -n "$CODESPACES" ] || [ -n "$GITHUB_CODESPACE_TOKEN" ]; then
        log_info "GitHub Codespaces environment detected"
        return 0
    else
        return 1
    fi
}

# ============================================
# Port Management Functions
# ============================================

kill_port() {
    local port=$1
    local process_name=$2
    
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warn "Port $port in use by $process_name, stopping..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            sleep 1
            log_success "Freed port $port"
        fi
    else
        # Fallback for systems without lsof
        pkill -f "node.*:$port" 2>/dev/null || true
    fi
}

is_port_open() {
    local port=$1
    if command -v nc >/dev/null 2>&1; then
        nc -z localhost $port >/dev/null 2>&1
    else
        timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null
    fi
}

configure_codespaces_ports() {
    if detect_codespaces; then
        log_info "Configuring Codespaces port visibility..."
        
        if check_command gh; then
            gh codespace ports visibility $BACKEND_PORT:public 2>/dev/null || \
                log_warn "Could not set backend port to public (manual configuration may be needed)"
            
            gh codespace ports visibility $FRONTEND_PORT:public 2>/dev/null || \
                log_warn "Could not set frontend port to public (manual configuration may be needed)"
            
            log_success "Port visibility configured"
        else
            log_warn "GitHub CLI not available - ports may need manual configuration"
            log_info "In VS Code PORTS tab, set ports $BACKEND_PORT and $FRONTEND_PORT to Public"
        fi
    fi
}

# ============================================
# Cleanup & Signal Handling
# ============================================

cleanup() {
    echo ""
    log_info "🧹 Shutting down services..."
    
    if [ -f "$PID_FILE" ]; then
        while IFS= read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                log_debug "Stopping process $pid"
                kill -TERM "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Kill any remaining node processes on our ports
    pkill -f "node.*$BACKEND_PORT" 2>/dev/null || true
    pkill -f "node.*$FRONTEND_PORT" 2>/dev/null || true
    
    log_success "Cleanup complete"
    echo ""
}

# Set trap for cleanup on exit
trap cleanup EXIT INT TERM

# ============================================
# Dependency Management
# ============================================

install_dependencies() {
    local service_name=$1
    local service_dir=$2
    
    cd "$service_dir"
    
    if [ "$SKIP_DEPS" = "true" ] && [ -d "node_modules" ]; then
        log_info "Skipping $service_name dependency check (--skip-deps flag)"
        cd "$SCRIPT_DIR"
        return 0
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "No package.json found in $service_dir"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    # Check if dependencies need installation/update
    local needs_install=false
    
    if [ ! -d "node_modules" ]; then
        needs_install=true
        log_info "$service_name dependencies not found, installing..."
    elif [ "package.json" -nt "node_modules" ]; then
        needs_install=true
        log_info "$service_name package.json updated, reinstalling dependencies..."
    fi
    
    if [ "$needs_install" = "true" ]; then
        npm install --prefer-offline --no-audit 2>&1 | tee -a "$STARTUP_LOG" | grep -E "(added|removed|changed|up to date)" || true
        
        if [ ${PIPESTATUS[0]} -ne 0 ]; then
            log_error "Failed to install $service_name dependencies"
            cd "$SCRIPT_DIR"
            return 1
        fi
        
        log_success "$service_name dependencies installed"
    else
        log_success "$service_name dependencies up to date"
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

# ============================================
# Database Setup
# ============================================

setup_database() {
    if [ "$SKIP_DB" = "true" ]; then
        log_info "Skipping database setup (--skip-db flag)"
        return 0
    fi
    
    log_step "Database Setup"
    
    cd "$BACKEND_DIR"
    
    # Reset database if requested
    if [ "$RESET_DB" = "true" ]; then
        log_info "Resetting database..."
        rm -f dev.db dev.db-journal
        rm -rf prisma/migrations
        log_success "Database reset"
    fi
    
    # Generate Prisma client first (needed for everything else)
    log_info "Generating Prisma client..."
    if npx prisma generate >> "$STARTUP_LOG" 2>&1; then
        log_success "Prisma client generated"
    else
        log_error "Failed to generate Prisma client"
        cd "$SCRIPT_DIR"
        return 1
    fi
    
    # Check if database exists
    if [ ! -f "dev.db" ]; then
        log_info "Creating new SQLite database..."
        
        # Use db push for development (simpler than migrations)
        log_info "Applying database schema..."
        if npx prisma db push --accept-data-loss --skip-generate >> "$STARTUP_LOG" 2>&1; then
            log_success "Database schema applied"
        else
            log_error "Failed to create database schema"
            log_info "Check logs: tail -20 $STARTUP_LOG"
            cd "$SCRIPT_DIR"
            return 1
        fi
        
        # Seed demo data
        log_info "Creating demo users..."
        if npx ts-node scripts/setup-db.ts >> "$STARTUP_LOG" 2>&1; then
            log_success "Demo data created"
            echo ""
            log_info "${BOLD}Demo Credentials:${NC}"
            log_info "  Admin: admin@demo.com / Demo@12345"
            log_info "  User:  user@demo.com / Demo@12345"
            echo ""
        else
            log_warn "Demo data setup had warnings (may already exist)"
        fi
    else
        log_success "Database already exists"
        
        # Verify schema is up to date
        log_info "Verifying database schema..."
        if npx prisma db push --skip-generate >> "$STARTUP_LOG" 2>&1; then
            log_success "Database schema is up to date"
        else
            log_warn "Schema verification completed with warnings"
        fi
        
        # Check if demo data exists
        log_info "Checking demo data..."
        if npx ts-node scripts/setup-db.ts >> "$STARTUP_LOG" 2>&1; then
            if tail -5 "$STARTUP_LOG" | grep -q "already exist"; then
                log_success "Demo users verified"
            else
                log_success "Demo data updated"
            fi
        fi
    fi
    
    cd "$SCRIPT_DIR"
    return 0
}

# ============================================
# Service Management
# ============================================

start_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    local log_file=$4
    
    if [ ! -d "$service_dir" ]; then
        log_error "$service_name directory not found: $service_dir"
        return 1
    fi
    
    cd "$service_dir"
    
    # Clear previous log
    > "$log_file"
    
    # Start the service
    log_info "Starting $service_name on port $port..."
    npm run dev >> "$log_file" 2>&1 &
    local PID=$!
    
    # Wait a moment for process to initialize
    sleep $SERVICE_START_WAIT
    
    # Verify process is running
    if ! kill -0 $PID 2>/dev/null; then
        log_error "$service_name failed to start. Check logs:"
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

# ============================================
# Service Monitoring
# ============================================

monitor_services() {
    local check_interval=10
    local last_check=$(date +%s)
    
    while true; do
        sleep $check_interval
        
        local current_time=$(date +%s)
        local pids_alive=0
        
        # Read all PIDs and check if they're alive
        if [ -f "$PID_FILE" ]; then
            while IFS= read -r pid; do
                if kill -0 "$pid" 2>/dev/null; then
                    ((pids_alive++))
                fi
            done < "$PID_FILE"
            
            # If no PIDs are alive, exit
            if [ $pids_alive -eq 0 ]; then
                log_error "All services have stopped"
                log_info "Check logs for details:"
                log_info "  Backend:  tail -50 $BACKEND_LOG"
                log_info "  Frontend: tail -50 $FRONTEND_LOG"
                return 1
            fi
        fi
        
        # Periodic health check (every minute)
        if [ $((current_time - last_check)) -ge 60 ]; then
            if is_port_open $BACKEND_PORT && is_port_open $FRONTEND_PORT; then
                log_debug "Health check passed - all services running"
            else
                log_warn "Service health check failed - some services may be down"
            fi
            last_check=$current_time
        fi
    done
}

# ============================================
# Main Execution Flow
# ============================================

# System checks
log_step "System Requirements Check"
check_node_version || exit 1
check_npm || exit 1
detect_codespaces

echo ""

# Configure ports for Codespaces
configure_codespaces_ports

echo ""

# Kill existing processes
log_step "Cleaning Up Existing Processes"
kill_port $BACKEND_PORT "Backend"
kill_port $FRONTEND_PORT "Frontend"
log_success "Ports cleared"

echo ""

# Install dependencies
log_step "Installing Dependencies"

if ! install_dependencies "Backend" "$BACKEND_DIR"; then
    log_error "Failed to install backend dependencies"
    exit 1
fi

if ! install_dependencies "Frontend" "$FRONTEND_DIR"; then
    log_error "Failed to install frontend dependencies"
    exit 1
fi

echo ""

# Setup database
if ! setup_database; then
    log_error "Database setup failed"
    exit 1
fi

echo ""

# Start backend
log_step "Starting Backend Service"
if ! start_service "Backend" "$BACKEND_DIR" "$BACKEND_PORT" "$BACKEND_LOG"; then
    log_error "Failed to start backend"
    exit 1
fi

echo ""

# Start frontend
log_step "Starting Frontend Service"
if ! start_service "Frontend" "$FRONTEND_DIR" "$FRONTEND_PORT" "$FRONTEND_LOG"; then
    log_error "Failed to start frontend"
    exit 1
fi

echo ""

# Health checks
log_step "Health Checks"

if ! check_service_health "Backend" "$BACKEND_PORT" "/api/health" "$HEALTH_CHECK_TIMEOUT"; then
    log_error "Backend health check failed"
    log_info "Check logs: tail -f $BACKEND_LOG"
    exit 1
fi

# Give frontend a bit more time
sleep 2

if is_port_open $FRONTEND_PORT; then
    log_success "Frontend is responsive"
else
    log_warn "Frontend may still be initializing..."
fi

echo ""

# Display success banner with URLs
if detect_codespaces; then
    CODESPACE_NAME=$(echo $CODESPACE_NAME | cut -d'-' -f1)
    FRONTEND_URL="https://${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-$CODESPACE_NAME-$FRONTEND_PORT.app.github.dev}"
    BACKEND_URL="https://${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-$CODESPACE_NAME-$BACKEND_PORT.app.github.dev}"
else
    FRONTEND_URL="http://localhost:$FRONTEND_PORT"
    BACKEND_URL="http://localhost:$BACKEND_PORT"
fi

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}✨ Development Environment Ready!${NC}                            ${GREEN}║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  📱 Frontend:     $FRONTEND_URL"
echo -e "${GREEN}║${NC}  🔌 Backend API:  $BACKEND_URL"
echo -e "${GREEN}║${NC}  📊 API Docs:     ${BACKEND_URL}/api-docs"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  ${BOLD}Demo Credentials:${NC}                                             ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Admin: admin@demo.com / Demo@12345                          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    User:  user@demo.com / Demo@12345                           ${GREEN}║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  📝 Logs:                                                       ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}    Backend:  tail -f $BACKEND_LOG"
echo -e "${GREEN}║${NC}    Frontend: tail -f $FRONTEND_LOG"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC}  ${YELLOW}⏹️  Press Ctrl+C to stop all servers${NC}                          ${GREEN}║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Monitor services and keep script running
log_info "Monitoring services (Ctrl+C to stop)..."
monitor_services
