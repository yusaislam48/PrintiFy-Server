#!/bin/bash

# deploy.sh - Production deployment script for PrintiFy Server
set -e

echo "🚀 ========================================"
echo "🎯 PRINTIFY SERVER DEPLOYMENT"
echo "🚀 ========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the server directory?"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
print_info "Node.js version: $NODE_VERSION"

# Check system resources
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "unknown")
TOTAL_MEM=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo "unknown")
print_info "System: $CPU_CORES CPU cores, $TOTAL_MEM memory"

# Install dependencies
print_info "Installing dependencies..."
npm install --production
print_status "Dependencies installed"

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_info "Installing PM2 globally..."
    npm install -g pm2
    print_status "PM2 installed globally"
else
    print_status "PM2 already installed"
fi

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Stop existing PM2 processes
print_info "Stopping existing PM2 processes..."
pm2 delete printify-server 2>/dev/null || echo "No existing processes to stop"

# Start the application with PM2
print_info "Starting PrintiFy Server with PM2..."
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script
print_info "Setting up PM2 startup script..."
pm2 startup | grep -E '^sudo' | bash || print_warning "Could not setup PM2 startup script (may need manual setup)"

print_status "Deployment completed successfully!"

echo ""
echo "🎉 ========================================"
echo "🚀 PRINTIFY SERVER IS RUNNING!"
echo "🎉 ========================================"
echo ""
echo "📊 Monitor your server:"
echo "   └─ pm2 monit"
echo "   └─ pm2 logs printify-server"
echo "   └─ pm2 status"
echo ""
echo "🔧 Manage your server:"
echo "   └─ pm2 restart printify-server"
echo "   └─ pm2 stop printify-server"
echo "   └─ pm2 reload printify-server"
echo ""
echo "📈 Performance will scale automatically with your VPS!"
echo "🎯 Ready to serve users with maximum efficiency!"
