#!/bin/bash

# 🚀 **Kubernetes Deployment Script**
# Production-ready deployment script for e-commerce application
# Interview Story: "This script deploys our entire e-commerce platform to production"

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${KUBERNETES_NAMESPACE:-ecommerce-production}
ENVIRONMENT=${ENVIRONMENT:-production}
IMAGE_TAG=${IMAGE_TAG:-latest}

echo -e "${BLUE}🚀 Starting Kubernetes Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}Image Tag: ${IMAGE_TAG}${NC}"

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ kubectl is available${NC}"
}

# Function to check if namespace exists
check_namespace() {
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        echo -e "${GREEN}✅ Namespace $NAMESPACE exists${NC}"
    else
        echo -e "${YELLOW}⚠️  Creating namespace $NAMESPACE${NC}"
        kubectl create namespace $NAMESPACE
    fi
}

# Function to deploy secrets
deploy_secrets() {
    echo -e "${BLUE}🔐 Deploying secrets...${NC}"
    
    # Create secrets if they don't exist
    if ! kubectl get secret ecommerce-secrets -n $NAMESPACE &> /dev/null; then
        echo -e "${YELLOW}⚠️  Creating secrets...${NC}"
        # Replace namespace in secrets.yaml and apply
        sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/secrets.yaml | kubectl apply -f -
    else
        echo -e "${GREEN}✅ Secrets already exist${NC}"
    fi
}

# Function to deploy database
deploy_database() {
    echo -e "${BLUE}🗄️  Deploying database...${NC}"
    
    # Create temporary files with correct namespace
    sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/postgres.yaml | kubectl apply -f -
    
    echo -e "${BLUE}🔴 Deploying Redis...${NC}"
    sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/redis.yaml | kubectl apply -f -
    
    # Wait for database to be ready
    echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l component=database -n $NAMESPACE --timeout=300s
    kubectl wait --for=condition=ready pod -l component=cache -n $NAMESPACE --timeout=300s
}

# Function to deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying application...${NC}"
    
    # Check if deployment exists with different selector (immutable field)
    if kubectl get deployment ecommerce-frontend-deployment -n $NAMESPACE &> /dev/null; then
        EXISTING_SELECTOR=$(kubectl get deployment ecommerce-frontend-deployment -n $NAMESPACE -o jsonpath='{.spec.selector.matchLabels}')
        echo -e "${YELLOW}⚠️  Existing deployment found with selector: $EXISTING_SELECTOR${NC}"
        echo -e "${YELLOW}⚠️  Deleting old deployment to apply new selector...${NC}"
        kubectl delete deployment ecommerce-frontend-deployment -n $NAMESPACE
        echo -e "${GREEN}✅ Old deployment deleted${NC}"
    fi
    
    # Update image tag in deployment
    if [ "$IMAGE_TAG" != "latest" ]; then
        echo -e "${BLUE}📝 Updating image tag to $IMAGE_TAG${NC}"
        kubectl set image deployment/ecommerce-frontend \
            ecommerce-app=pavandoc1990/ecommerce-production-client:$IMAGE_TAG \
            -n $NAMESPACE
    fi
    
    # Apply deployment
    sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/deployment.yaml | kubectl apply -f -
    sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/service.yaml | kubectl apply -f -
    sed "s/namespace: ecommerce/namespace: $NAMESPACE/g" ../base/ingress.yaml | kubectl apply -f -
}

# Function to deploy monitoring stack
deploy_monitoring() {
    echo -e "${BLUE}📊 Deploying monitoring stack...${NC}"
    
    # Check if monitoring directory exists
    if [ -d "../monitoring" ]; then
        echo -e "${BLUE}📁 Found monitoring directory, deploying stack...${NC}"
        cd ../monitoring
        ./deploy-monitoring.sh
        cd ../scripts
        echo -e "${GREEN}✅ Monitoring stack deployed${NC}"
    else
        echo -e "${YELLOW}⚠️  Monitoring directory not found, skipping monitoring deployment${NC}"
    fi
}

# Function to wait for deployment
wait_for_deployment() {
    echo -e "${YELLOW}⏳ Waiting for deployment to be ready...${NC}"
    kubectl rollout status deployment/ecommerce-frontend-deployment -n $NAMESPACE --timeout=300s
}

# Function to run health checks
run_health_checks() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Get pod name
    POD_NAME=$(kubectl get pods -l app=ecommerce,component=frontend -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$POD_NAME" ]; then
        echo -e "${RED}❌ No frontend pod found${NC}"
        exit 1
    fi
    
    # Port forward and test
    echo -e "${BLUE}🔗 Setting up port forward...${NC}"
    kubectl port-forward pod/$POD_NAME 8080:3000 -n $NAMESPACE &
    PORT_FORWARD_PID=$!
    
    # Wait for port forward to be ready
    sleep 10
    
    # Test health endpoint
    echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
    if curl -f http://localhost:8080/api/health; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        kill $PORT_FORWARD_PID 2>/dev/null || true
        exit 1
    fi
    
    # Clean up port forward
    kill $PORT_FORWARD_PID 2>/dev/null || true
}

# Function to show deployment status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    kubectl get all -n $NAMESPACE
    
    echo -e "\n${BLUE}📋 Pod Status:${NC}"
    kubectl get pods -n $NAMESPACE
    
    echo -e "\n${BLUE}🔗 Services:${NC}"
    kubectl get services -n $NAMESPACE
}

# Main deployment flow
main() {
    echo -e "${BLUE}🚀 Starting E-commerce Kubernetes Deployment${NC}"
    
    check_kubectl
    check_namespace
    deploy_secrets
    deploy_database
    deploy_application
    deploy_monitoring
    wait_for_deployment
    run_health_checks
    show_status
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Application should be available at: http://localhost:3000${NC}"
    echo -e "${BLUE}📊 Monitoring stack deployed in 'monitoring' namespace${NC}"
}

# Run main function
main "$@"