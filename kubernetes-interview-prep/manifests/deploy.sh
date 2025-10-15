#!/bin/bash

# 🚀 **E-commerce Kubernetes Deployment Script**
# This script demonstrates real-world deployment practices

set -e

echo "🚀 Starting E-commerce Kubernetes Deployment..."

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

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

# Check if we can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster"
    print_warning "Make sure you have a cluster running and kubeconfig is set"
    exit 1
fi

print_success "Connected to Kubernetes cluster: $(kubectl config current-context)"

# Step 1: Create namespace
print_status "Creating namespace..."
kubectl apply -f ecommerce-namespace.yaml
print_success "Namespace created"

# Step 2: Create secrets
print_status "Creating secrets..."
kubectl apply -f ecommerce-secrets.yaml
print_success "Secrets created"

# Step 3: Create configmaps
print_status "Creating configmaps..."
kubectl apply -f ecommerce-configmap.yaml
print_success "ConfigMaps created"

# Step 4: Create RBAC
print_status "Setting up RBAC..."
kubectl apply -f ecommerce-rbac.yaml
print_success "RBAC configured"

# Step 5: Deploy database
print_status "Deploying PostgreSQL database..."
kubectl apply -f postgres-statefulset.yaml
print_success "PostgreSQL deployed"

# Step 6: Deploy Redis
print_status "Deploying Redis cache..."
kubectl apply -f redis-deployment.yaml
print_success "Redis deployed"

# Step 7: Wait for database to be ready
print_status "Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce-production --timeout=300s
print_success "Database is ready"

# Step 8: Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n ecommerce-production --timeout=300s
print_success "Redis is ready"

# Step 9: Deploy application
print_status "Deploying e-commerce application..."
kubectl apply -f ecommerce-deployment.yaml
print_success "Application deployed"

# Step 10: Create service
print_status "Creating service..."
kubectl apply -f ecommerce-service.yaml
print_success "Service created"

# Step 11: Create HPA
print_status "Setting up Horizontal Pod Autoscaler..."
kubectl apply -f ecommerce-hpa.yaml
print_success "HPA configured"

# Step 12: Create Pod Disruption Budget
print_status "Creating Pod Disruption Budget..."
kubectl apply -f ecommerce-pdb.yaml
print_success "PDB created"

# Step 13: Apply network policy
print_status "Applying network policies..."
kubectl apply -f ecommerce-network-policy.yaml
print_success "Network policies applied"

# Step 14: Wait for application to be ready
print_status "Waiting for application to be ready..."
kubectl wait --for=condition=available deployment/ecommerce-frontend -n ecommerce-production --timeout=300s
print_success "Application is ready"

# Step 15: Verify deployment
print_status "Verifying deployment..."

echo ""
echo "📊 Deployment Status:"
echo "===================="

# Check pods
echo "Pods:"
kubectl get pods -n ecommerce-production

echo ""
echo "Services:"
kubectl get svc -n ecommerce-production

echo ""
echo "Deployments:"
kubectl get deployments -n ecommerce-production

echo ""
echo "HPA:"
kubectl get hpa -n ecommerce-production

echo ""
echo "PDB:"
kubectl get pdb -n ecommerce-production

# Test application health
print_status "Testing application health..."
if kubectl port-forward svc/ecommerce-frontend-service 8080:80 -n ecommerce-production &
then
    PORT_FORWARD_PID=$!
    sleep 5
    
    if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed - may still be starting up"
    fi
    
    kill $PORT_FORWARD_PID 2>/dev/null || true
fi

echo ""
print_success "🎉 E-commerce application deployed successfully!"
echo ""
echo "📋 Access Information:"
echo "======================"
echo "Namespace: ecommerce-production"
echo "Application: ecommerce-frontend"
echo "Service: ecommerce-frontend-service"
echo ""
echo "🔧 Useful Commands:"
echo "==================="
echo "View logs: kubectl logs -f deployment/ecommerce-frontend -n ecommerce-production"
echo "Scale app: kubectl scale deployment ecommerce-frontend --replicas=10 -n ecommerce-production"
echo "Port forward: kubectl port-forward svc/ecommerce-frontend-service 8080:80 -n ecommerce-production"
echo "View HPA: kubectl get hpa ecommerce-frontend-hpa -n ecommerce-production"
echo "Describe pod: kubectl describe pod <pod-name> -n ecommerce-production"
echo ""
echo "🎯 Next Steps:"
echo "=============="
echo "1. Set up ingress controller for external access"
echo "2. Configure monitoring and alerting"
echo "3. Set up CI/CD pipeline"
echo "4. Implement backup strategies"
echo "5. Configure security scanning"
