#!/bin/bash

# ============================================
# NVM Setup - Must be done FIRST
# ============================================

# Source nvm if it exists
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    # Use a sensible default if no version is currently selected
    nvm use --silent 24 2>/dev/null || nvm use --silent node 2>/dev/null || true
fi

# ============================================
# Script Header & Documentation
# ============================================

# ToolBox - Complete Development Environment Setup & Startup Script
# 
# This script provides a comprehensive development environment setup including:
# - Dependency management (Node.js, npm, system packages)
# - Database initialization (SQLite with demo data)
# - Port configuration (GitHub Codespaces support)
# - Process management (graceful shutdown, health checks)
# - Logging and monitoring
#
# Requirements: Node.js 24+, npm
# Usage: bash dev.sh [--reset] [--skip-db] [--help]

set -e  # Exit on error
set -o pipefail  # Catch errors in pipes

# ============================================
# Configuration
# ============================================

# Set Development Environment
export NODE_ENV=development
export LOG_LEVEL=debug

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
HEALTH_CHECK_TIMEOUT=90
HEALTH_CHECK_INTERVAL=3
SERVICE_START_WAIT=5

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
# Environment Detection
# ============================================

source_nvm() {
    export NVM_DIR="$HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck source=/dev/null
        . "$NVM_DIR/nvm.sh"
        # Try to use the latest installed version if available
        if command -v nvm >/dev/null 2>&1; then
            nvm use --silent node 2>/dev/null || true
        fi
        return 0
    fi
    return 1
}

# Detect and display environment information
detect_environment() {
    if [ -n "$CODESPACES" ]; then
        log_info "🌐 Running in GitHub Codespaces"
    elif [ -n "$REMOTE_CONTAINERS" ] || [ -n "$VSCODE_REMOTE_CONTAINERS_SESSION" ]; then
        log_info "🐳 Running in VS Code Remote Container"
    elif [ -n "$WSL_DISTRO_NAME" ]; then
        log_info "🪟 Running in WSL (Windows Subsystem for Linux)"
    else
        log_info "💻 Running in local environment"
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
        local node_version_full
        node_version_full=$(node -v)
        local node_version_major
        node_version_major=$(echo "$node_version_full" | cut -d'v' -f2 | cut -d'.' -f1)

        # Vite requires Node 24+
        if [ "$node_version_major" -ge 24 ]; then
            log_success "Node.js $node_version_full detected"
            return 0
        fi

        log_error "Node.js version $node_version_full is too old. Required: 24+."
        return 1
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
        # Try sourcing nvm one more time if npm wasn't found
        if [ -s "$HOME/.nvm/nvm.sh" ]; then
            # shellcheck source=/dev/null
            . "$HOME/.nvm/nvm.sh"
            if check_command npm; then
                log_success "npm $(npm -v) detected (via nvm)"
                return 0
            fi
        fi
        
        # Try looking for npm in common nvm paths
        for nvmpath in "$HOME/.nvm/versions/node"/v*/bin; do
            if [ -x "$nvmpath/npm" ]; then
                export PATH="$nvmpath:$PATH"
                if check_command npm; then
                    log_success "npm $(npm -v) detected (from nvm path)"
                    return 0
                fi
            fi
        done
        
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

# Automatic Node.js installer helper
# Attempts to install Node.js 24 via nvm (preferred) or via system package manager as a fallback.
install_node_auto() {
    if check_command node && check_node_version; then
        return 0
    fi

    log_step "Node.js not found or version is too old — attempting automated install"

    # Try to use an existing nvm installation
    if source_nvm && command -v nvm >/dev/null 2>&1; then
        log_info "Installing Node.js 24 via nvm..."
        if nvm install 24 >>"$STARTUP_LOG" 2>&1; then
            log_success "Node.js installed via nvm"
            return 0
        fi
    fi

    # Try to install nvm non-interactively
    if command -v curl >/dev/null 2>&1 || command -v wget >/dev/null 2>&1; then
        log_info "Installing nvm (v0.40.3)..."
        # Install nvm (best-effort, non-fatal)
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash >>"$STARTUP_LOG" 2>&1 || true
        
        if source_nvm && command -v nvm >/dev/null 2>&1; then
            log_info "Installing Node.js 24 via newly-installed nvm..."
            if nvm install 24 >>"$STARTUP_LOG" 2>&1; then
                log_success "Node.js installed via nvm"
                return 0
            fi
        fi
    fi

    # Fallback: try system package manager (requires sudo)
    PKG_MANAGER=""
    if command -v dnf >/dev/null 2>&1; then
        PKG_MANAGER="dnf"
    elif command -v yum >/dev/null 2>&1; then
        PKG_MANAGER="yum"
    elif command -v apt-get >/dev/null 2>&1; then
        PKG_MANAGER="apt-get"
    elif command -v pacman >/dev/null 2>&1; then
        PKG_MANAGER="pacman"
    elif command -v zypper >/dev/null 2>&1; then
        PKG_MANAGER="zypper"
    fi

    if [ -n "$PKG_MANAGER" ]; then
        log_info "Attempting system package install using $PKG_MANAGER (may prompt for sudo)..."
        case $PKG_MANAGER in
            dnf|yum)
                sudo $PKG_MANAGER install -y nodejs npm >>"$STARTUP_LOG" 2>&1 || true
                ;;
            apt-get)
                sudo apt-get update -y >>"$STARTUP_LOG" 2>&1 || true
                # Use NodeSource to get a modern Node 24 package
                curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - >>"$STARTUP_LOG" 2>&1 || true
                sudo apt-get install -y nodejs >>"$STARTUP_LOG" 2>&1 || true
                ;;
            pacman)
                sudo pacman -Syu --noconfirm nodejs npm >>"$STARTUP_LOG" 2>&1 || true
                ;;
            zypper)
                sudo zypper install -y nodejs npm >>"$STARTUP_LOG" 2>&1 || true
                ;;
        esac

        if check_command node; then
            log_success "Node.js installed via $PKG_MANAGER"
            return 0
        fi
    fi

    log_warn "Automatic Node.js installation failed or not possible in this environment."
    log_info "Please install Node.js 24+ manually: https://nodejs.org/ or use nvm (https://github.com/nvm-sh/nvm)"
    return 1
}

# Check for required system tools and install if needed
check_system_tools() {
    local tools_needed=()
    
    # Check for curl or wget (needed for downloads)
    if ! check_command curl && ! check_command wget; then
        tools_needed+=("curl")
    fi
    
    # Check for git (needed for development)
    if ! check_command git; then
        tools_needed+=("git")
    fi
    
    # Check for build essentials (needed for native node modules)
    if ! check_command gcc && ! check_command cc; then
        if command -v apt-get >/dev/null 2>&1; then
            tools_needed+=("build-essential")
        elif command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
            tools_needed+=("gcc" "gcc-c++" "make")
        fi
    fi
    
    if [ ${#tools_needed[@]} -gt 0 ]; then
        log_warn "Missing system tools: ${tools_needed[*]}"
        log_info "Installing required system tools..."
        
        if command -v apt-get >/dev/null 2>&1; then
            sudo apt-get update -y >>"$STARTUP_LOG" 2>&1 || true
            sudo apt-get install -y "${tools_needed[@]}" >>"$STARTUP_LOG" 2>&1 || true
        elif command -v dnf >/dev/null 2>&1; then
            sudo dnf install -y "${tools_needed[@]}" >>"$STARTUP_LOG" 2>&1 || true
        elif command -v yum >/dev/null 2>&1; then
            sudo yum install -y "${tools_needed[@]}" >>"$STARTUP_LOG" 2>&1 || true
        elif command -v pacman >/dev/null 2>&1; then
            sudo pacman -Syu --noconfirm "${tools_needed[@]}" >>"$STARTUP_LOG" 2>&1 || true
        fi
        
        log_success "System tools installation completed"
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
        # Use --legacy-peer-deps for compatibility with React 19
        npm install --prefer-offline --no-audit --legacy-peer-deps 2>&1 | tee -a "$STARTUP_LOG" | grep -E "(added|removed|changed|up to date)" || true
        
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
    
    # Setup environment variables for database
    log_info "Configuring database environment..."
    
    # Create or update .env file with DATABASE_URL for SQLite
    if [ ! -f ".env" ]; then
        # Copy from .env.development if it exists, or create new
        if [ -f ".env.development" ]; then
            cp ".env.development" ".env"
            log_info "Created .env from .env.development"
        else
            touch ".env"
            log_info "Created new .env file"
        fi
    fi
    
    # Ensure DATABASE_URL is set in .env file
    if ! grep -q "^DATABASE_URL=" ".env" 2>/dev/null; then
        echo "DATABASE_URL=file:./prisma/dev.db" >> ".env"
        log_info "Added DATABASE_URL to .env"
    fi
    
    # Ensure JWT_SECRET is set for development
    if ! grep -q "^JWT_SECRET=" ".env" 2>/dev/null; then
        echo "JWT_SECRET=dev-jwt-secret-change-in-production-$(date +%s)" >> ".env"
        log_info "Added JWT_SECRET to .env"
    fi
    
    # Ensure JWT_REFRESH_SECRET is set for development
    if ! grep -q "^JWT_REFRESH_SECRET=" ".env" 2>/dev/null; then
        echo "JWT_REFRESH_SECRET=dev-jwt-refresh-secret-change-in-production-$(date +%s)" >> ".env"
        log_info "Added JWT_REFRESH_SECRET to .env"
    fi
    
    # Export DATABASE_URL for Prisma commands
    export DATABASE_URL="file:./prisma/dev.db"
    log_success "Database environment configured"
    
    # Reset database if requested
    if [ "$RESET_DB" = "true" ]; then
        log_info "Resetting database..."
        rm -f prisma/dev.db prisma/dev.db-journal
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
    if [ ! -f "prisma/dev.db" ]; then
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

setup_frontend_env() {
    log_info "Configuring frontend environment..."
    cd "$FRONTEND_DIR"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp ".env.example" ".env.local"
            log_info "Created .env.local from .env.example"
        else
            # Create minimal .env.local with required variables
            cat > ".env.local" << EOF
# Frontend Environment Variables
VITE_API_URL=http://localhost:$BACKEND_PORT
VITE_APP_NAME=ToolBox
VITE_APP_VERSION=1.0.0
EOF
            log_info "Created new .env.local file"
        fi
    fi
    
    # Ensure VITE_API_URL is set
    if ! grep -q "^VITE_API_URL=" ".env.local" 2>/dev/null; then
        echo "VITE_API_URL=http://localhost:$BACKEND_PORT/api" >> ".env.local"
        log_info "Added VITE_API_URL to .env.local"
    fi
    
    log_success "Frontend environment configured"
    cd "$SCRIPT_DIR"
}

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
        
        # Try multiple hosts and endpoints
        local hosts=("localhost" "127.0.0.1" "0.0.0.0")
        local endpoints=("$endpoint" "${endpoint#/api}")
        
        local success=false
        if command -v curl >/dev/null 2>&1; then
            for host in "${hosts[@]}"; do
                for ep in "${endpoints[@]}"; do
                    if curl -s -f "http://$host:$port$ep" > /dev/null 2>&1; then
                        log_success "$service_name is responsive at http://$host:$port$ep"
                        return 0
                    fi
                done
            done
        fi
        
        # Fallback to port check
        if is_port_open $port; then
            log_success "$service_name is responsive (port $port is open)"
            return 0
        fi
        
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $timeout ]; then
            log_error "$service_name health check failed after $timeout seconds"
            log_warn "Service may still be starting. Check logs: tail -f $LOG_DIR/${service_name,,}.log"
            return 1
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            log_info "Still waiting for $service_name... (${elapsed}s elapsed)"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# ============================================
# Service Monitoring
# ============================================

monitor_services() {
    local check_interval=5
    local last_check=$(date +%s)
    local startup_time=$(date +%s)
    local consecutive_failures=0
    
    log_info "Services started. Monitoring for crashes... (Press Ctrl+C to stop)"
    
    while true; do
        sleep $check_interval
        
        local current_time=$(date +%s)
        local backend_alive=false
        local frontend_alive=false
        
        # Check if ports are responding (more reliable than PID checking)
        if is_port_open $BACKEND_PORT 2>/dev/null; then
            backend_alive=true
        fi
        
        if is_port_open $FRONTEND_PORT 2>/dev/null; then
            frontend_alive=true
        fi
        
        # Track consecutive failures
        if ! $backend_alive || ! $frontend_alive; then
            ((consecutive_failures++))
            
            if [ $consecutive_failures -eq 1 ]; then
                # First detection of a service being down
                if ! $backend_alive; then
                    log_warn "Backend appears to be down (port $BACKEND_PORT not responding)"
                fi
                if ! $frontend_alive; then
                    log_warn "Frontend appears to be down (port $FRONTEND_PORT not responding)"
                fi
            fi
            
            # Only declare failure after 3 consecutive checks (~15 seconds)
            if [ $consecutive_failures -ge 3 ]; then
                local uptime=$((current_time - startup_time))
                if [ $uptime -gt 60 ]; then
                    log_error "Services have been down for too long. Exiting."
                    log_info "Check logs for details:"
                    log_info "  Backend:  tail -100 $BACKEND_LOG"
                    log_info "  Frontend: tail -100 $FRONTEND_LOG"
                    return 1
                fi
            fi
        else
            # Services are responding - reset failure counter
            if [ $consecutive_failures -gt 0 ]; then
                consecutive_failures=0
                log_success "Services are responding again"
            fi
        fi
        
        # Periodic verbose health check (every 120 seconds)
        if [ $((current_time - last_check)) -ge 120 ]; then
            if $backend_alive && $frontend_alive; then
                log_debug "✓ All services running normally"
            fi
            last_check=$current_time
        fi
    done
}

# ============================================
# Main Execution
# ============================================

main() {
    # Initial cleanup and banner
    > "$PID_FILE" # Clear PID file at the start
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}ToolBox - Development Environment Setup${NC}              ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${NC}  SQLite Dev DB • Auto Dependencies • Health Checks       ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Detect environment
    detect_environment
    detect_codespaces || true  # Don't exit if not in Codespaces
    echo ""

    # --- Node.js Version Management ---
    log_step "System Requirements Check"
    
    # Try to source nvm first
    source_nvm

    # Check node version. If it fails, try to install.
    if ! check_node_version; then
        if ! install_node_auto; then
            log_error "Automated Node.js installation failed."
            exit 1
        fi
        
        # After installation, re-source nvm and re-check version
        log_info "Re-checking Node.js version after installation..."
        if ! source_nvm; then
            log_warn "Could not source nvm after installation. The script may fail."
        fi

        if ! check_node_version; then
            log_error "Node.js installation completed, but the correct version is not active."
            log_info "Please try running 'source ~/.nvm/nvm.sh' or restart your terminal."
            exit 1
        fi
    fi

    # Check for npm
    if ! check_npm; then
        exit 1
    fi
    
    # Check for other system tools
    check_system_tools

    echo ""

    # Verify project structure
    log_step "Verifying Project Structure"
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    if [ ! -f "$BACKEND_DIR/package.json" ]; then
        log_error "Backend package.json not found"
        exit 1
    fi
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_error "Frontend package.json not found"
        exit 1
    fi
    log_success "Project structure verified"

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

    # Setup frontend environment
    setup_frontend_env

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
        # Better Codespaces URL detection
        if [ -n "$CODESPACE_NAME" ]; then
            FRONTEND_URL="https://${CODESPACE_NAME}-${FRONTEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
            BACKEND_URL="https://${CODESPACE_NAME}-${BACKEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
        else
            # Fallback for older Codespaces
            FRONTEND_URL="https://localhost:$FRONTEND_PORT"
            BACKEND_URL="https://localhost:$BACKEND_PORT"
        fi
        ENVIRONMENT="Codespaces"
    else
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
        BACKEND_URL="http://localhost:$BACKEND_PORT"
        ENVIRONMENT="Local"
    fi

    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}✨ Development Environment Ready!${NC} ${CYAN}($ENVIRONMENT)${NC}              ${GREEN}║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}🌐 Server URLs:${NC}                                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    📱 Frontend:  ${CYAN}$FRONTEND_URL${NC}"
    echo -e "${GREEN}║${NC}    🔌 Backend:   ${CYAN}$BACKEND_URL${NC}"
    echo -e "${GREEN}║${NC}    📊 API Docs:  ${CYAN}${BACKEND_URL}/api-docs${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}👤 Demo Credentials:${NC}                                          ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    ${YELLOW}Admin:${NC} admin@demo.com / Demo@12345                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    ${YELLOW}User:${NC}  user@demo.com / Demo@12345                         ${GREEN}║${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${BOLD}📝 Logs:${NC}                                                       ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    Backend:  ${MAGENTA}tail -f $BACKEND_LOG${NC}"
    echo -e "${GREEN}║${NC}    Frontend: ${MAGENTA}tail -f $FRONTEND_LOG${NC}"
    echo -e "${GREEN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}⏹️  Press Ctrl+C to stop all servers${NC}                          ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Output clickable URIs for VS Code terminal
    echo -e "${BOLD}${CYAN}🔗 Click to open:${NC}"
    echo -e "   Frontend:  ${FRONTEND_URL}"
    echo -e "   Backend:   ${BACKEND_URL}"
    echo -e "   API Docs:  ${BACKEND_URL}/api-docs"
    echo ""

    # Monitor services and keep script running
    log_info "Monitoring services (Ctrl+C to stop)..."
    monitor_services
}

# Run main function
main
