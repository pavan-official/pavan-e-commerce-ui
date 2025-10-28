#!/bin/bash

# ============================================================
# DEPLOY TO EXISTING MINIKUBE CLUSTER
# ============================================================
# This script deploys your app to an ALREADY RUNNING Minikube
# Much faster than spinning up a new cluster each time!
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"
NAMESPACE="${NAMESPACE:-ecommerce-production}"
IMAGE_NAME="${IMAGE_NAME:-ecommerce-frontend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ============================================================
# HELPER FUNCTIONS
# ============================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================================
# PRE-FLIGHT CHECKS
# ============================================================

preflight_checks() {
    log_info "Running pre-flight checks..."
    
    # Check if Minikube is installed
    if ! command -v minikube &> /dev/null; then
        log_error "Minikube is not installed"
        exit 1
    fi
    
    # Check if Minikube is running
    STATUS=$(minikube status -p "$MINIKUBE_PROFILE" --format='{{.Host}}' 2>/dev/null || echo "NotRunning")
    
    if [ "$STATUS" != "Running" ]; then
        log_error "Minikube is not running"
        log_info "Please start Minikube first with: minikube start -p $MINIKUBE_PROFILE"
        exit 1
    fi
    
    log_success "Minikube is running!"
    
    # Check kubectl connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_success "Pre-flight checks passed!"
}

# ============================================================
# BUILD DOCKER IMAGE IN MINIKUBE
# ============================================================

build_image() {
    log_info "Building Docker image in Minikube..."
    
    # Connect to Minikube's Docker daemon
    eval $(minikube -p "$MINIKUBE_PROFILE" docker-env)
    
    # Navigate to client directory
    cd "$(dirname "$0")/../client"
    
    # Build Docker image
    log_info "Building image: $IMAGE_NAME:$IMAGE_TAG"
    docker build \
        --cache-from "$IMAGE_NAME:latest" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        -t "$IMAGE_NAME:latest" \
        -t "$IMAGE_NAME:$IMAGE_TAG" \
        .
    
    log_success "Docker image built successfully!"
    docker images | grep "$IMAGE_NAME"
    
    # Return to root directory
    cd "$(dirname "$0")/.."
}

# ============================================================
# DEPLOY TO KUBERNETES
# ============================================================

deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Set kubectl context to Minikube
    kubectl config use-context "$MINIKUBE_PROFILE"
    
    # Create namespace if it doesn't exist
    log_info "Creating namespace: $NAMESPACE"
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy using existing deployment script
    log_info "Running deployment script..."
    cd "$(dirname "$0")/../k8s-manifests/scripts"
    chmod +x deploy.sh
    
    export NAMESPACE="$NAMESPACE"
    export IMAGE_TAG="$IMAGE_TAG"
    
    ./deploy.sh production minikube
    
    cd "$(dirname "$0")/.."
    
    log_success "Deployment initiated!"
}

# ============================================================
# WAIT FOR DEPLOYMENT
# ============================================================

wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/ecommerce-frontend-deployment \
        -n "$NAMESPACE"
    
    log_success "Deployment is ready!"
    
    echo ""
    log_info "Pod status:"
    kubectl get pods -n "$NAMESPACE"
}

# ============================================================
# GET SERVICE URLS
# ============================================================

get_service_urls() {
    log_info "Getting service URLs..."
    
    echo ""
    echo "======================================"
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "======================================"
    echo ""
    echo "📊 ACCESS YOUR APPLICATION:"
    echo "   Frontend: $(minikube service ecommerce-frontend-service -n "$NAMESPACE" --url)"
    echo ""
    echo "📊 MONITORING STACK:"
    echo "   Prometheus: $(minikube service prometheus-service -n monitoring --url 2>/dev/null || echo 'Not deployed')"
    echo "   Grafana: $(minikube service grafana-service -n monitoring --url 2>/dev/null || echo 'Not deployed')"
    echo "   Jaeger: $(minikube service jaeger-query -n monitoring --url 2>/dev/null || echo 'Not deployed')"
    echo ""
    echo "🔍 KUBERNETES DASHBOARD:"
    echo "   Run: minikube dashboard -p $MINIKUBE_PROFILE"
    echo ""
    echo "🔧 USEFUL COMMANDS:"
    echo "   View logs: kubectl logs -f deployment/ecommerce-frontend-deployment -n $NAMESPACE"
    echo "   View pods: kubectl get pods -n $NAMESPACE"
    echo "   Restart: kubectl rollout restart deployment/ecommerce-frontend-deployment -n $NAMESPACE"
    echo ""
    echo "======================================"
}

# ============================================================
# MAIN EXECUTION
# ============================================================

main() {
    echo ""
    echo "======================================"
    echo "🚀 DEPLOY TO EXISTING MINIKUBE"
    echo "======================================"
    echo ""
    echo "Configuration:"
    echo "  Minikube Profile: $MINIKUBE_PROFILE"
    echo "  Namespace: $NAMESPACE"
    echo "  Image: $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    
    preflight_checks
    build_image
    deploy_to_kubernetes
    wait_for_deployment
    get_service_urls
    
    log_success "All done! 🎉"
}

# Run main function
main "$@"

