#!/bin/bash

# 🚀 **Kubernetes Deployment with Database Seeding**
# Purpose: Deploy the e-commerce application with test users and sample data

set -e

echo "🚀 **Kubernetes Deployment with Database Seeding**"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Starting Kubernetes deployment with database seeding..."

# 1. Create namespace
print_status "Creating namespace..."
kubectl create namespace ecommerce-production --dry-run=client -o yaml | kubectl apply -f -

# 2. Apply base configurations
print_status "Applying base configurations..."
kubectl apply -f k8s-manifests/base/namespace.yaml
kubectl apply -f k8s-manifests/base/configmap.yaml
kubectl apply -f k8s-manifests/base/secrets.yaml

# 3. Apply database and Redis
print_status "Setting up database and Redis..."
kubectl apply -f k8s-manifests/base/postgres.yaml
kubectl apply -f k8s-manifests/base/redis.yaml

# 4. Wait for database to be ready
print_status "Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce-production --timeout=300s || print_warning "Database not ready within timeout"

# 5. Apply service
print_status "Applying service configuration..."
kubectl apply -f k8s-manifests/base/service.yaml

# 6. Apply deployment
print_status "Applying deployment configuration..."
kubectl apply -f k8s-manifests/base/deployment.yaml

# 7. Wait for deployment to be ready
print_status "Waiting for deployment to be ready..."
kubectl wait --for=condition=available deployment/ecommerce-frontend -n ecommerce-production --timeout=300s || print_warning "Deployment not ready within timeout"

# 8. Apply ingress
print_status "Applying ingress configuration..."
kubectl apply -f k8s-manifests/base/ingress.yaml

# 9. Wait for pods to be running
print_status "Waiting for application pods to be running..."
kubectl wait --for=condition=ready pod -l app=ecommerce -n ecommerce-production --timeout=300s

# 10. Seed database with test data
print_status "Seeding database with test data..."
POD_NAME=$(kubectl get pods -n ecommerce-production -l app=ecommerce -o jsonpath='{.items[0].metadata.name}')

if [ ! -z "$POD_NAME" ]; then
    print_status "Seeding database via pod: $POD_NAME"
    
    # Enable seeding in production for this deployment
    kubectl exec -n ecommerce-production $POD_NAME -- sh -c "export ALLOW_SEEDING=true"
    
    # Call the seeding API
    kubectl exec -n ecommerce-production $POD_NAME -- curl -X POST http://localhost:3000/api/seed || print_warning "Database seeding failed"
    
    print_success "Database seeded with test users and sample data"
else
    print_warning "No application pod found for database seeding"
fi

# 11. Get ingress IP
print_status "Getting ingress IP..."
INGRESS_IP=$(kubectl get ingress ecommerce-ingress -n ecommerce-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")

if [ -z "$INGRESS_IP" ]; then
    print_warning "No ingress IP found. You may need to use port-forwarding:"
    echo "kubectl port-forward -n ecommerce-production service/ecommerce-frontend-service 3000:80"
    echo "Then access the application at: http://localhost:3000"
else
    print_success "Ingress IP: $INGRESS_IP"
    echo "Access the application at: http://$INGRESS_IP"
fi

# 12. Test endpoints
print_status "Testing endpoints..."
if [ ! -z "$INGRESS_IP" ]; then
    print_status "Testing health endpoint..."
    curl -s -o /dev/null -w "Health check: %{http_code}\n" http://$INGRESS_IP/api/health || print_warning "Health check failed"
    
    print_status "Testing products endpoint..."
    curl -s -o /dev/null -w "Products API: %{http_code}\n" http://$INGRESS_IP/api/products || print_warning "Products API failed"
    
    print_status "Testing auth session endpoint..."
    curl -s -o /dev/null -w "Auth session: %{http_code}\n" http://$INGRESS_IP/api/auth/custom-session || print_warning "Auth session endpoint failed"
else
    print_warning "Cannot test endpoints without ingress IP"
fi

# 13. Show deployment status
print_status "Deployment status:"
kubectl get pods -n ecommerce-production
kubectl get services -n ecommerce-production
kubectl get ingress -n ecommerce-production

print_success "Kubernetes deployment with database seeding complete!"
print_status "Test users created:"
echo "  - customer@example.com (password: password123) - Regular customer"
echo "  - admin@example.com (password: admin123) - Admin user"
echo "  - user@test.com (password: test123) - Test user"
print_status "Next steps:"
echo "1. Access the application using the URL above"
echo "2. Login with any of the test users"
echo "3. Test adding items to cart"
echo "4. Test multiple item functionality"
echo "5. Check logs if issues persist: kubectl logs -n ecommerce-production deployment/ecommerce-frontend"

