#!/bin/bash

# Complete Kubernetes Development Setup Script
# This script sets up the entire e-commerce application in Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${1:-ecommerce-production}
DATADOG_API_KEY=${DATADOG_API_KEY:-"7f0366fcb84c32a4ca1a0ab942af86a4"}

echo -e "${BLUE}🚀 Starting Complete Kubernetes Development Setup${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}DataDog API Key: ${DATADOG_API_KEY:0:8}...${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Minikube is running
if ! minikube status > /dev/null 2>&1; then
    print_error "Minikube is not running. Please start Minikube first:"
    echo "minikube start --memory=4096 --cpus=2"
    exit 1
fi

print_status "Minikube is running"

# Enable required addons
echo -e "${BLUE}🔧 Enabling Minikube addons...${NC}"
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
print_status "Minikube addons enabled"

# Set Docker environment to Minikube
echo -e "${BLUE}🐳 Setting up Docker environment...${NC}"
eval $(minikube docker-env)
print_status "Docker environment configured"

# Build application Docker image
echo -e "${BLUE}🏗️  Building application Docker image...${NC}"
cd client
docker build -t ecommerce-frontend:latest .
cd ..
print_status "Application Docker image built"

# Create namespaces
echo -e "${BLUE}📦 Creating namespaces...${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
print_status "Namespaces created"

# Deploy application stack
echo -e "${BLUE}🚀 Deploying application stack...${NC}"
cd k8s-manifests/scripts
chmod +x deploy.sh
./deploy.sh ${NAMESPACE}
cd ../..
print_status "Application stack deployed"

# Deploy monitoring stack
echo -e "${BLUE}📊 Deploying monitoring stack...${NC}"
cd k8s-manifests/monitoring

# Deploy DataDog
if [ ! -z "$DATADOG_API_KEY" ]; then
    echo -e "${BLUE}🐕 Deploying DataDog...${NC}"
    chmod +x deploy-datadog-operator.sh
    DATADOG_API_KEY=${DATADOG_API_KEY} ./deploy-datadog-operator.sh
    print_status "DataDog deployed"
else
    print_warning "DataDog API key not provided, skipping DataDog deployment"
fi

# Deploy Prometheus, Grafana, Jaeger, AlertManager
echo -e "${BLUE}📈 Deploying Prometheus...${NC}"
kubectl apply -f prometheus.yaml

echo -e "${BLUE}📊 Deploying Grafana...${NC}"
kubectl apply -f grafana.yaml

echo -e "${BLUE}🔍 Deploying Jaeger...${NC}"
kubectl apply -f jaeger.yaml

echo -e "${BLUE}🚨 Deploying AlertManager...${NC}"
kubectl apply -f alertmanager.yaml

cd ../..
print_status "Monitoring stack deployed"

# Wait for deployments to be ready
echo -e "${BLUE}⏳ Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/ecommerce-frontend-deployment -n ${NAMESPACE} || print_warning "Frontend deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n ${NAMESPACE} || print_warning "PostgreSQL deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n monitoring || print_warning "Prometheus deployment timeout"
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n monitoring || print_warning "Grafana deployment timeout"

print_status "Deployments are ready"

# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Display application URLs
echo -e "${BLUE}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}📱 Application URLs:${NC}"
echo -e "   Frontend:     http://${MINIKUBE_IP}:3000"
echo -e "   Grafana:      http://${MINIKUBE_IP}:3001"
echo -e "   Prometheus:   http://${MINIKUBE_IP}:9090"
echo -e "   Jaeger:       http://${MINIKUBE_IP}:16686"
echo -e "   AlertManager: http://${MINIKUBE_IP}:9093"
echo -e "   DataDog:      https://us5.datadoghq.com"

echo -e "${GREEN}📋 Management Commands:${NC}"
echo -e "   Kubernetes Dashboard: minikube dashboard"
echo -e "   View Pods:           kubectl get pods -A"
echo -e "   View Services:       kubectl get svc -A"
echo -e "   View Logs:           kubectl logs -f deployment/ecommerce-frontend-deployment -n ${NAMESPACE}"

echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo -e "   Port Forward Frontend: kubectl port-forward svc/ecommerce-frontend-service -n ${NAMESPACE} 3000:3000"
echo -e "   Port Forward Grafana:  kubectl port-forward svc/grafana -n monitoring 3001:3000"
echo -e "   Port Forward Prometheus: kubectl port-forward svc/prometheus -n monitoring 9090:9090"

# Run basic health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"
sleep 10

# Check if services are responding
if curl -f -s http://${MINIKUBE_IP}:3000/api/health > /dev/null; then
    print_status "Frontend health check passed"
else
    print_warning "Frontend health check failed - service may still be starting"
fi

if curl -f -s http://${MINIKUBE_IP}:9090/-/healthy > /dev/null; then
    print_status "Prometheus health check passed"
else
    print_warning "Prometheus health check failed - service may still be starting"
fi

echo -e "${GREEN}🎯 Next Steps:${NC}"
echo -e "   1. Open http://${MINIKUBE_IP}:3000 in your browser"
echo -e "   2. Check DataDog dashboard for metrics"
echo -e "   3. Monitor logs: kubectl logs -f deployment/ecommerce-frontend-deployment -n ${NAMESPACE}"
echo -e "   4. Scale application: kubectl scale deployment ecommerce-frontend-deployment --replicas=3 -n ${NAMESPACE}"

print_status "Complete Kubernetes development environment is ready! 🚀"
