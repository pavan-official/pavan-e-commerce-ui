#!/bin/bash

# 🔍 **Kubernetes Debug Script**
# Purpose: Debug 404 and routing issues in Kubernetes deployment

set -e

echo "🔍 **Kubernetes Debug Script**"
echo "================================"

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

print_status "Starting Kubernetes debug analysis..."

# 1. Check namespaces
print_status "Checking namespaces..."
kubectl get namespaces | grep ecommerce || print_warning "No ecommerce namespaces found"

# 2. Check deployments
print_status "Checking deployments..."
kubectl get deployments -A | grep ecommerce || print_warning "No ecommerce deployments found"

# 3. Check services
print_status "Checking services..."
kubectl get services -A | grep ecommerce || print_warning "No ecommerce services found"

# 4. Check ingress
print_status "Checking ingress..."
kubectl get ingress -A | grep ecommerce || print_warning "No ecommerce ingress found"

# 5. Check pods
print_status "Checking pods..."
kubectl get pods -A | grep ecommerce || print_warning "No ecommerce pods found"

# 6. Check pod logs for errors
print_status "Checking pod logs for errors..."
PODS=$(kubectl get pods -A | grep ecommerce | awk '{print $1 " " $2}')
if [ ! -z "$PODS" ]; then
    echo "$PODS" | while read namespace pod; do
        print_status "Checking logs for pod $pod in namespace $namespace..."
        kubectl logs -n $namespace $pod --tail=50 | grep -i "error\|404\|failed" || print_success "No errors found in pod $pod"
    done
else
    print_warning "No ecommerce pods found to check logs"
fi

# 7. Check service endpoints
print_status "Checking service endpoints..."
kubectl get endpoints -A | grep ecommerce || print_warning "No ecommerce endpoints found"

# 8. Test service connectivity
print_status "Testing service connectivity..."
SERVICES=$(kubectl get services -A | grep ecommerce | awk '{print $1 " " $2 " " $5}')
if [ ! -z "$SERVICES" ]; then
    echo "$SERVICES" | while read namespace service ports; do
        print_status "Testing service $service in namespace $namespace..."
        # Extract port from ports column (format: 80:30000/TCP)
        PORT=$(echo $ports | cut -d: -f1)
        if [ ! -z "$PORT" ]; then
            kubectl run debug-pod --image=busybox --rm -it --restart=Never -- nslookup $service.$namespace.svc.cluster.local || print_warning "DNS resolution failed for $service"
        fi
    done
else
    print_warning "No ecommerce services found to test"
fi

# 9. Check ingress controller
print_status "Checking ingress controller..."
kubectl get pods -n ingress-nginx 2>/dev/null || print_warning "NGINX ingress controller not found"

# 10. Check ingress rules
print_status "Checking ingress rules..."
kubectl describe ingress -A | grep -A 20 "ecommerce" || print_warning "No ecommerce ingress rules found"

# 11. Test API endpoints
print_status "Testing API endpoints..."
INGRESS_IP=$(kubectl get ingress -A -o jsonpath='{.items[*].status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ ! -z "$INGRESS_IP" ]; then
    print_status "Testing API endpoints on ingress IP: $INGRESS_IP"
    curl -s -o /dev/null -w "Health check: %{http_code}\n" http://$INGRESS_IP/api/health || print_warning "Health check failed"
    curl -s -o /dev/null -w "API products: %{http_code}\n" http://$INGRESS_IP/api/products || print_warning "API products endpoint failed"
    curl -s -o /dev/null -w "API auth session: %{http_code}\n" http://$INGRESS_IP/api/auth/custom-session || print_warning "API auth session endpoint failed"
else
    print_warning "No ingress IP found"
fi

# 12. Check for common issues
print_status "Checking for common issues..."

# Check if pods are running
RUNNING_PODS=$(kubectl get pods -A | grep ecommerce | grep Running | wc -l)
TOTAL_PODS=$(kubectl get pods -A | grep ecommerce | wc -l)

if [ "$RUNNING_PODS" -lt "$TOTAL_PODS" ]; then
    print_warning "Not all ecommerce pods are running ($RUNNING_PODS/$TOTAL_PODS)"
    kubectl get pods -A | grep ecommerce | grep -v Running
fi

# Check for image pull issues
kubectl get events -A | grep -i "pull\|image" | tail -5 || print_success "No image pull issues found"

# Check for resource constraints
kubectl top pods -A 2>/dev/null | grep ecommerce || print_warning "Metrics not available for resource check"

print_success "Debug analysis complete!"
print_status "Summary:"
echo "- Check the output above for any warnings or errors"
echo "- If pods are not running, check: kubectl describe pod <pod-name> -n <namespace>"
echo "- If services are not accessible, check: kubectl describe service <service-name> -n <namespace>"
echo "- If ingress is not working, check: kubectl describe ingress <ingress-name> -n <namespace>"

