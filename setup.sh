#!/bin/bash

# ===========================================
# E-Commerce Project Setup Script
# ===========================================

set -e  # Exit on any error

echo "🚀 Setting up E-Commerce Project..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20.x"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    print_success "pnpm $(pnpm -v) is available"
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL 16.x"
    else
        print_success "PostgreSQL is available"
    fi
    
    # Check Redis
    if ! command -v redis-cli &> /dev/null; then
        print_warning "Redis is not installed. Please install Redis 7.2.x"
    else
        print_success "Redis is available"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    pnpm install
    cd ..
    
    # Install admin dependencies
    print_status "Installing admin dependencies..."
    cd admin
    pnpm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Client environment
    if [ ! -f "client/.env.local" ]; then
        cp client/.env.example client/.env.local
        print_success "Created client/.env.local"
    else
        print_warning "client/.env.local already exists"
    fi
    
    # Admin environment
    if [ ! -f "admin/.env.local" ]; then
        cp admin/.env.example admin/.env.local
        print_success "Created admin/.env.local"
    else
        print_warning "admin/.env.local already exists"
    fi
}

# Generate secrets
generate_secrets() {
    print_status "Generating secrets..."
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    # Update client .env.local
    if [ -f "client/.env.local" ]; then
        sed -i.bak "s/your_nextauth_secret_here_minimum_32_characters/$NEXTAUTH_SECRET/g" client/.env.local
        rm client/.env.local.bak
    fi
    
    # Update admin .env.local
    if [ -f "admin/.env.local" ]; then
        sed -i.bak "s/your_nextauth_secret_here_minimum_32_characters/$NEXTAUTH_SECRET/g" admin/.env.local
        rm admin/.env.local.bak
    fi
    
    print_success "Generated NextAuth secret"
}

# Check services
check_services() {
    print_status "Checking required services..."
    
    # Check PostgreSQL
    if command -v psql &> /dev/null; then
        if pg_isready -q; then
            print_success "PostgreSQL is running"
        else
            print_warning "PostgreSQL is not running. Please start PostgreSQL"
        fi
    fi
    
    # Check Redis
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            print_success "Redis is running"
        else
            print_warning "Redis is not running. Please start Redis"
        fi
    fi
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    check_prerequisites
    echo ""
    
    install_dependencies
    echo ""
    
    setup_environment
    echo ""
    
    generate_secrets
    echo ""
    
    check_services
    echo ""
    
    print_success "Setup completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Edit client/.env.local and admin/.env.local with your configuration"
    echo "2. Set up your database and Redis if not already running"
    echo "3. Configure your Stripe keys for payment processing"
    echo "4. Run 'pnpm dev' in both client and admin directories"
    echo ""
    echo "📚 See SETUP.md for detailed configuration instructions"
    echo ""
    echo "Happy coding! 🎉"
}

# Run main function
main "$@"
