#!/bin/bash

# 🔍 **Pre-Deployment Validation Script**
# Validates all prerequisites before triggering CI/CD pipeline
# Prevents common deployment failures by catching issues early

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo -e "${BLUE}🔍 E-Commerce Platform - Pre-Deployment Validation${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Function to report error
report_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ERRORS=$((ERRORS + 1))
}

# Function to report warning
report_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# Function to report success
report_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo -e "${BLUE}1️⃣  Checking Kubernetes Configuration Files${NC}"
echo "-------------------------------------------"

# Check base YAML files have correct namespace
BASE_DIR="../base"
EXPECTED_NAMESPACE="ecommerce"

for file in deployment.yaml service.yaml ingress.yaml postgres.yaml redis.yaml secrets.yaml; do
    if [ -f "$BASE_DIR/$file" ]; then
        NAMESPACE=$(grep "namespace:" "$BASE_DIR/$file" | head -1 | awk '{print $2}')
        if [ "$NAMESPACE" = "$EXPECTED_NAMESPACE" ]; then
            report_success "Base $file has correct namespace: $NAMESPACE"
        else
            report_error "Base $file has wrong namespace: $NAMESPACE (expected: $EXPECTED_NAMESPACE)"
            echo "  Fix: Update $BASE_DIR/$file to use 'namespace: ecommerce'"
        fi
    else
        report_warning "$BASE_DIR/$file not found"
    fi
done

echo ""
echo -e "${BLUE}2️⃣  Checking Secret Configuration${NC}"
echo "-------------------------------"

# Check if secrets.yaml has all required keys
REQUIRED_KEYS=("postgres-password" "redis-password" "encryption-key" "nextauth-secret" "stripe-secret-key")
SECRET_FILE="$BASE_DIR/secrets.yaml"

if [ -f "$SECRET_FILE" ]; then
    for key in "${REQUIRED_KEYS[@]}"; do
        if grep -q "$key:" "$SECRET_FILE"; then
            report_success "Secret key '$key' found"
        else
            report_error "Secret key '$key' missing in $SECRET_FILE"
        fi
    done
else
    report_error "Secrets file not found: $SECRET_FILE"
fi

echo ""
echo -e "${BLUE}3️⃣  Checking Minikube Status${NC}"
echo "---------------------------"

if command -v minikube &> /dev/null; then
    if minikube status --format='{{.Host}}' 2>/dev/null | grep -q "Running"; then
        report_success "Minikube is running"
        
        # Check Minikube addons
        echo ""
        echo -e "${BLUE}   Checking Minikube addons:${NC}"
        if minikube addons list | grep -q "ingress.*enabled"; then
            report_success "   Ingress addon enabled"
        else
            report_warning "   Ingress addon not enabled (may be needed)"
        fi
        
        if minikube addons list | grep -q "metrics-server.*enabled"; then
            report_success "   Metrics-server addon enabled"
        else
            report_warning "   Metrics-server addon not enabled (recommended)"
        fi
    else
        report_error "Minikube is not running. Start it with: minikube start"
    fi
else
    report_warning "Minikube not found (OK if using cloud Kubernetes)"
fi

echo ""
echo -e "${BLUE}4️⃣  Checking GitHub Actions Runner${NC}"
echo "--------------------------------"

if [ -d "$HOME/actions-runner" ]; then
    report_success "GitHub Actions runner directory found"
    
    # Check if runner is configured
    if [ -f "$HOME/actions-runner/.runner" ]; then
        report_success "Runner is configured"
        
        # Try to check if runner is running (basic check)
        if pgrep -f "actions-runner" > /dev/null; then
            report_success "Runner appears to be running"
        else
            report_warning "Runner may not be running. Check: cd ~/actions-runner && ./run.sh"
        fi
    else
        report_error "Runner not configured. Run setup: cd ~/actions-runner && ./config.sh"
    fi
else
    report_warning "GitHub Actions runner not found (OK if using GitHub-hosted runners)"
fi

echo ""
echo -e "${BLUE}5️⃣  Checking Docker Configuration${NC}"
echo "--------------------------------"

# Check Dockerfile exists
CLIENT_DIR="../../client"
if [ -f "$CLIENT_DIR/Dockerfile" ]; then
    report_success "Dockerfile found"
    
    # Check required files for Docker build
    for file in package.json pnpm-lock.yaml start.sh; do
        if [ -f "$CLIENT_DIR/$file" ]; then
            report_success "Required file found: $file"
        else
            report_error "Required file missing: $file"
        fi
    done
    
    # Check .dockerignore doesn't exclude required files
    if [ -f "$CLIENT_DIR/.dockerignore" ]; then
        if grep -q "^start.sh$" "$CLIENT_DIR/.dockerignore" 2>/dev/null; then
            report_error ".dockerignore excludes start.sh (should be whitelisted with !start.sh)"
        else
            report_success ".dockerignore doesn't exclude start.sh"
        fi
        
        if grep -q "^pnpm-lock.yaml$" "$CLIENT_DIR/.dockerignore" 2>/dev/null; then
            report_error ".dockerignore excludes pnpm-lock.yaml (should be whitelisted)"
        else
            report_success ".dockerignore doesn't exclude pnpm-lock.yaml"
        fi
    fi
else
    report_error "Dockerfile not found in $CLIENT_DIR"
fi

echo ""
echo -e "${BLUE}6️⃣  Checking CI/CD Workflow Configuration${NC}"
echo "----------------------------------------"

WORKFLOW_FILE="../../.github/workflows/complete-k8s-cicd.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    report_success "CI/CD workflow file found"
    
    # Check if workflow uses self-hosted runner
    if grep -q "runs-on: self-hosted" "$WORKFLOW_FILE"; then
        report_success "Workflow configured for self-hosted runner"
    else
        report_warning "Workflow uses GitHub-hosted runner"
    fi
    
    # Check if workflow has deploy-to-kubernetes job
    if grep -q "deploy-to-kubernetes:" "$WORKFLOW_FILE"; then
        report_success "Deploy job found in workflow"
    else
        report_error "Deploy job not found in workflow"
    fi
else
    report_error "CI/CD workflow file not found: $WORKFLOW_FILE"
fi

echo ""
echo -e "${BLUE}7️⃣  Checking Namespace Consistency${NC}"
echo "---------------------------------"

# This is the critical check for the namespace doubling bug
if [ -d "$BASE_DIR" ]; then
    INCONSISTENT=0
    for file in deployment.yaml service.yaml ingress.yaml postgres.yaml redis.yaml secrets.yaml; do
        if [ -f "$BASE_DIR/$file" ]; then
            if grep -q "namespace: ecommerce-production" "$BASE_DIR/$file" 2>/dev/null; then
                report_error "$file has 'ecommerce-production' instead of 'ecommerce'"
                echo "  This will cause namespace doubling (ecommerce-production-production)"
                echo "  Fix: sed -i '' 's/namespace: ecommerce-production/namespace: ecommerce/g' $BASE_DIR/$file"
                INCONSISTENT=1
            fi
        fi
    done
    
    if [ $INCONSISTENT -eq 0 ]; then
        report_success "All base YAML files use correct namespace 'ecommerce'"
    fi
fi

echo ""
echo -e "${BLUE}8️⃣  Checking ServiceAccount References${NC}"
echo "-------------------------------------"

# Check if deployment references a ServiceAccount that needs to be created
DEPLOY_FILE="../base/deployment.yaml"
if [ -f "$DEPLOY_FILE" ]; then
    # Check for uncommented serviceAccountName
    SA_NAME=$(grep "^[[:space:]]*serviceAccountName:" "$DEPLOY_FILE" | awk '{print $2}')
    if [ -n "$SA_NAME" ]; then
        report_warning "Deployment references ServiceAccount: $SA_NAME"
        echo "  Make sure this ServiceAccount exists or comment out the reference"
        echo "  Tip: Use default SA by commenting: # serviceAccountName: $SA_NAME"
    else
        report_success "Deployment uses default ServiceAccount (no custom SA referenced)"
    fi
else
    report_warning "Deployment file not found"
fi

echo ""
echo -e "${BLUE}9️⃣  Checking Monitoring Stack Configuration${NC}"
echo "----------------------------------------"

MONITORING_SCRIPT="../monitoring/deploy-monitoring.sh"
if [ -f "$MONITORING_SCRIPT" ]; then
    # Check if monitoring script correctly sets namespace to 'monitoring'
    if grep -q "^NAMESPACE=monitoring$" "$MONITORING_SCRIPT"; then
        report_success "Monitoring script uses correct namespace: monitoring"
    elif grep -q "NAMESPACE=\${KUBERNETES_NAMESPACE:-monitoring}" "$MONITORING_SCRIPT"; then
        report_error "Monitoring script inherits KUBERNETES_NAMESPACE (should be hardcoded to 'monitoring')"
        echo "  This will cause namespace conflicts when deploying monitoring stack"
        echo "  Fix: Change to NAMESPACE=monitoring in $MONITORING_SCRIPT"
    else
        report_warning "Could not verify monitoring namespace configuration"
    fi
    
    # Check if all called functions are defined
    MISSING_FUNCS=0
    for func in deploy_prometheus deploy_alertmanager deploy_grafana deploy_jaeger deploy_datadog; do
        if grep -q "^deploy_${func#deploy_}()" "$MONITORING_SCRIPT" 2>/dev/null || \
           grep -q "^${func}()" "$MONITORING_SCRIPT" 2>/dev/null; then
            : # Function exists, do nothing
        else
            report_error "Function $func is called but not defined in monitoring script"
            MISSING_FUNCS=1
        fi
    done
    
    if [ $MISSING_FUNCS -eq 0 ]; then
        report_success "All monitoring deployment functions are defined"
    fi
else
    report_warning "Monitoring deployment script not found"
fi

echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}📊 Validation Summary${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Found $ERRORS error(s)${NC}"
    echo -e "${RED}🚫 DO NOT proceed with deployment until errors are fixed${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $WARNINGS warning(s)${NC}"
    echo -e "${YELLOW}⚡ You can proceed but review warnings first${NC}"
    exit 0
else
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo -e "${GREEN}🚀 Safe to proceed with deployment${NC}"
    exit 0
fi

