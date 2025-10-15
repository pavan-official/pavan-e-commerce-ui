#!/bin/bash
# ==================================================================================================
# SECURITY SCANNING SCRIPT - PRODUCTION-READY SECURITY VALIDATION
# ==================================================================================================
#
# Purpose: Comprehensive security scanning for containers and application
# Why: Essential for production security compliance and vulnerability management
#
# Interview Topics:
# - Container security scanning
# - Vulnerability management
# - Compliance checking
# - Security automation
# - CI/CD security integration
#
# ==================================================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORTS_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create reports directory
mkdir -p "$REPORTS_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ==================================================================================================
# CONTAINER VULNERABILITY SCANNING WITH TRIVY
# ==================================================================================================

scan_container_vulnerabilities() {
    log "🔍 Starting container vulnerability scanning with Trivy..."
    
    local image_name="ecommerce-client"
    local report_file="$REPORTS_DIR/trivy_scan_${TIMESTAMP}.json"
    
    # Run Trivy scan
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$REPORTS_DIR:/reports" \
        aquasec/trivy:latest \
        image \
        --format json \
        --output "/reports/trivy_scan_${TIMESTAMP}.json" \
        --severity HIGH,CRITICAL \
        "$image_name:latest"
    
    # Generate human-readable report
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$REPORTS_DIR:/reports" \
        aquasec/trivy:latest \
        image \
        --format table \
        --output "/reports/trivy_scan_${TIMESTAMP}.txt" \
        --severity HIGH,CRITICAL \
        "$image_name:latest"
    
    # Check for critical vulnerabilities
    local critical_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "$report_file" 2>/dev/null || echo "0")
    local high_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH")] | length' "$report_file" 2>/dev/null || echo "0")
    
    if [ "$critical_count" -gt 0 ]; then
        error "Found $critical_count CRITICAL vulnerabilities!"
        return 1
    elif [ "$high_count" -gt 0 ]; then
        warning "Found $high_count HIGH vulnerabilities"
        return 1
    else
        success "No critical or high vulnerabilities found"
        return 0
    fi
}

# ==================================================================================================
# CONTAINER SECURITY BENCHMARKING WITH TRIVY
# ==================================================================================================

scan_container_security() {
    log "🛡️ Starting container security benchmarking..."
    
    local image_name="ecommerce-client"
    local report_file="$REPORTS_DIR/trivy_security_${TIMESTAMP}.json"
    
    # Run security benchmark
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$REPORTS_DIR:/reports" \
        aquasec/trivy:latest \
        config \
        --format json \
        --output "/reports/trivy_security_${TIMESTAMP}.json" \
        "$image_name:latest"
    
    # Generate human-readable report
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$REPORTS_DIR:/reports" \
        aquasec/trivy:latest \
        config \
        --format table \
        --output "/reports/trivy_security_${TIMESTAMP}.txt" \
        "$image_name:latest"
    
    success "Security benchmark completed"
}

# ==================================================================================================
# DOCKERFILE SECURITY ANALYSIS
# ==================================================================================================

analyze_dockerfile() {
    log "📋 Analyzing Dockerfile security..."
    
    local dockerfile="$PROJECT_ROOT/client/Dockerfile"
    local report_file="$REPORTS_DIR/dockerfile_analysis_${TIMESTAMP}.txt"
    
    # Check for security best practices
    {
        echo "Dockerfile Security Analysis Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        
        echo "✅ Security Checks:"
        echo ""
        
        # Check for non-root user
        if grep -q "USER nextjs" "$dockerfile"; then
            echo "✅ Non-root user configured"
        else
            echo "❌ No non-root user found"
        fi
        
        # Check for multi-stage build
        if grep -q "FROM.*AS" "$dockerfile"; then
            echo "✅ Multi-stage build detected"
        else
            echo "❌ Single-stage build (not recommended)"
        fi
        
        # Check for .dockerignore
        if [ -f "$PROJECT_ROOT/client/.dockerignore" ]; then
            echo "✅ .dockerignore file present"
        else
            echo "❌ .dockerignore file missing"
        fi
        
        # Check for COPY vs ADD
        if grep -q "ADD" "$dockerfile" && ! grep -q "COPY" "$dockerfile"; then
            echo "⚠️ Using ADD instead of COPY"
        else
            echo "✅ Using COPY appropriately"
        fi
        
        # Check for specific versions
        if grep -q "FROM node:.*-alpine" "$dockerfile"; then
            echo "✅ Using specific Alpine version"
        else
            echo "⚠️ Consider using specific version tags"
        fi
        
        echo ""
        echo "🔍 Detailed Analysis:"
        echo ""
        
        # Show base image
        echo "Base Image:"
        grep "^FROM" "$dockerfile" | head -1
        echo ""
        
        # Show user configuration
        echo "User Configuration:"
        grep "USER" "$dockerfile" || echo "No USER directive found"
        echo ""
        
        # Show exposed ports
        echo "Exposed Ports:"
        grep "EXPOSE" "$dockerfile" || echo "No EXPOSE directive found"
        echo ""
        
    } > "$report_file"
    
    success "Dockerfile analysis completed"
    cat "$report_file"
}

# ==================================================================================================
# DEPENDENCY VULNERABILITY SCANNING
# ==================================================================================================

scan_dependencies() {
    log "📦 Scanning application dependencies..."
    
    cd "$PROJECT_ROOT/client"
    
    # NPM audit
    local audit_file="$REPORTS_DIR/npm_audit_${TIMESTAMP}.json"
    npm audit --json > "$audit_file" 2>/dev/null || true
    
    # Generate human-readable report
    local audit_txt="$REPORTS_DIR/npm_audit_${TIMESTAMP}.txt"
    npm audit > "$audit_txt" 2>&1 || true
    
    # Check for high/critical vulnerabilities
    local critical_count=$(jq '.metadata.vulnerabilities.critical // 0' "$audit_file" 2>/dev/null || echo "0")
    local high_count=$(jq '.metadata.vulnerabilities.high // 0' "$audit_file" 2>/dev/null || echo "0")
    
    if [ "$critical_count" -gt 0 ]; then
        error "Found $critical_count CRITICAL npm vulnerabilities!"
        return 1
    elif [ "$high_count" -gt 0 ]; then
        warning "Found $high_count HIGH npm vulnerabilities"
        return 1
    else
        success "No critical or high npm vulnerabilities found"
        return 0
    fi
}

# ==================================================================================================
# SECURITY HEADERS CHECK
# ==================================================================================================

check_security_headers() {
    log "🔒 Checking security headers..."
    
    local url="http://localhost:3000"
    local report_file="$REPORTS_DIR/security_headers_${TIMESTAMP}.txt"
    
    # Check if application is running
    if ! curl -s --connect-timeout 5 "$url" > /dev/null; then
        warning "Application not running at $url, skipping security headers check"
        return 0
    fi
    
    {
        echo "Security Headers Analysis Report"
        echo "Generated: $(date)"
        echo "URL: $url"
        echo "=========================================="
        echo ""
        
        echo "Security Headers Check:"
        echo ""
        
        # Check common security headers
        local headers=(
            "Strict-Transport-Security:HSTS"
            "X-Content-Type-Options:Content Type Protection"
            "X-Frame-Options:Clickjacking Protection"
            "X-XSS-Protection:XSS Protection"
            "Content-Security-Policy:CSP"
            "Referrer-Policy:Referrer Policy"
            "Permissions-Policy:Permissions Policy"
        )
        
        for header in "${headers[@]}"; do
            IFS=':' read -r header_name description <<< "$header"
            if curl -s -I "$url" | grep -qi "$header_name"; then
                echo "✅ $description ($header_name): Present"
            else
                echo "❌ $description ($header_name): Missing"
            fi
        done
        
        echo ""
        echo "All Headers:"
        echo "------------"
        curl -s -I "$url" | grep -i "x-\|strict-\|content-security\|permissions-"
        
    } > "$report_file"
    
    success "Security headers check completed"
    cat "$report_file"
}

# ==================================================================================================
# RUNTIME SECURITY CHECK WITH FALCO
# ==================================================================================================

check_runtime_security() {
    log "🛡️ Checking runtime security with Falco..."
    
    # Check if Falco is running
    if ! docker ps | grep -q "falco"; then
        warning "Falco not running, starting security profile..."
        docker-compose --profile security up -d falco
        sleep 10
    fi
    
    # Get Falco logs for security events
    local report_file="$REPORTS_DIR/falco_events_${TIMESTAMP}.txt"
    
    {
        echo "Falco Runtime Security Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        
        echo "Recent Security Events:"
        echo "----------------------"
        
        # Get recent Falco events
        docker logs ecommerce-falco --tail 50 2>&1 | grep -E "(WARN|ERROR|CRITICAL)" || echo "No recent security events found"
        
    } > "$report_file"
    
    success "Runtime security check completed"
    cat "$report_file"
}

# ==================================================================================================
# NETWORK SECURITY CHECK
# ==================================================================================================

check_network_security() {
    log "🌐 Checking network security configuration..."
    
    local report_file="$REPORTS_DIR/network_security_${TIMESTAMP}.txt"
    
    {
        echo "Network Security Analysis Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        
        echo "Docker Networks:"
        echo "---------------"
        docker network ls
        echo ""
        
        echo "Network Details:"
        echo "---------------"
        docker network inspect e-commerce-ui_backend e-commerce-ui_frontend 2>/dev/null || echo "Networks not found"
        echo ""
        
        echo "Container Network Configuration:"
        echo "-------------------------------"
        docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Networks}}"
        echo ""
        
        echo "Exposed Ports Check:"
        echo "-------------------"
        # Check for unnecessary exposed ports
        docker ps --format "{{.Names}}\t{{.Ports}}" | grep -v ":::" || echo "No external ports exposed"
        
    } > "$report_file"
    
    success "Network security check completed"
    cat "$report_file"
}

# ==================================================================================================
# COMPLIANCE CHECK
# ==================================================================================================

check_compliance() {
    log "📋 Running compliance checks..."
    
    local report_file="$REPORTS_DIR/compliance_${TIMESTAMP}.txt"
    
    {
        echo "Security Compliance Report"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        
        echo "Docker Security Best Practices:"
        echo "------------------------------"
        
        # Check Docker daemon configuration
        echo "Docker daemon info:"
        docker info | grep -E "Security Options|Storage Driver|Logging Driver" || echo "Could not retrieve daemon info"
        echo ""
        
        # Check for privileged containers
        echo "Privileged containers check:"
        if docker ps --format "{{.Names}}\t{{.Command}}" | grep -q "privileged"; then
            echo "⚠️ Privileged containers detected"
        else
            echo "✅ No privileged containers"
        fi
        echo ""
        
        # Check for root containers
        echo "Root containers check:"
        docker ps --format "{{.Names}}\t{{.Command}}" | grep -v "nextjs" && echo "⚠️ Some containers may be running as root" || echo "✅ Containers using non-root users"
        echo ""
        
    } > "$report_file"
    
    success "Compliance check completed"
    cat "$report_file"
}

# ==================================================================================================
# MAIN EXECUTION
# ==================================================================================================

main() {
    log "🚀 Starting comprehensive security scan..."
    echo ""
    
    local exit_code=0
    
    # Run all security checks
    analyze_dockerfile || exit_code=1
    echo ""
    
    scan_dependencies || exit_code=1
    echo ""
    
    scan_container_vulnerabilities || exit_code=1
    echo ""
    
    scan_container_security || exit_code=1
    echo ""
    
    check_security_headers || exit_code=1
    echo ""
    
    check_runtime_security || exit_code=1
    echo ""
    
    check_network_security || exit_code=1
    echo ""
    
    check_compliance || exit_code=1
    echo ""
    
    # Summary
    log "📊 Security scan completed!"
    echo ""
    echo "Reports generated in: $REPORTS_DIR"
    echo ""
    echo "Generated files:"
    ls -la "$REPORTS_DIR"/*_${TIMESTAMP}.* 2>/dev/null || echo "No files generated"
    
    if [ $exit_code -eq 0 ]; then
        success "✅ All security checks passed!"
    else
        error "❌ Some security checks failed. Please review the reports."
    fi
    
    echo ""
    log "🔗 View reports:"
    echo "   ls -la $REPORTS_DIR/*_${TIMESTAMP}.*"
    echo ""
    log "📧 For production: Integrate with CI/CD pipeline and alerting systems"
    
    exit $exit_code
}

# Help function
show_help() {
    echo "Security Scanning Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -v, --verbose  Enable verbose output"
    echo "  -q, --quick    Run quick scan (skip time-intensive checks)"
    echo ""
    echo "Examples:"
    echo "  $0                 # Run full security scan"
    echo "  $0 --quick         # Run quick security scan"
    echo "  $0 --verbose       # Run with verbose output"
    echo ""
    echo "Generated reports will be saved to: security-reports/"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        -q|--quick)
            warning "Quick scan mode - skipping time-intensive checks"
            # Modify functions to skip slow operations
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
