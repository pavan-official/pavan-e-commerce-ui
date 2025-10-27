#!/bin/bash

# 🚀 **Production Deployment Script**
# Complete production deployment automation
# Interview Story: "This is our automated deployment system that handles everything"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="ecommerce-production"
DOCKER_HUB_REPO="pavandoc1990/ecommerce-production"
IMAGE_TAG="${1:-latest}"

echo -e "${BLUE}🚀 Starting Production Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Namespace: ${NAMESPACE}"
echo -e "Docker Hub Repo: ${DOCKER_HUB_REPO}"
echo -e "Image Tag: ${IMAGE_TAG}"
echo ""

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ kubectl is available${NC}"
}

# Function to check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
        echo -e "${YELLOW}💡 Make sure your kubeconfig is set correctly${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"
}

# Function to create namespace
create_namespace() {
    echo -e "${BLUE}📁 Creating namespace...${NC}"
    kubectl apply -f environments/prod/namespace.yaml
    echo -e "${GREEN}✅ Namespace created${NC}"
}

# Function to create secrets
create_secrets() {
    echo -e "${BLUE}🔐 Creating secrets...${NC}"
    kubectl apply -f production-secrets.yaml
    echo -e "${GREEN}✅ Secrets created${NC}"
}

# Function to create configmaps
create_configmaps() {
    echo -e "${BLUE}⚙️ Creating configmaps...${NC}"
    kubectl apply -f production-configmap.yaml
    echo -e "${GREEN}✅ Configmaps created${NC}"
}

# Function to create RBAC
create_rbac() {
    echo -e "${BLUE}🔑 Creating RBAC...${NC}"
    kubectl apply -f ecommerce-rbac.yaml
    echo -e "${GREEN}✅ RBAC created${NC}"
}

# Function to deploy database
deploy_database() {
    echo -e "${BLUE}🗄️ Deploying PostgreSQL...${NC}"
    kubectl apply -f postgres-production.yaml
    echo -e "${GREEN}✅ PostgreSQL deployed${NC}"
    
    echo -e "${BLUE}⏳ Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
}

# Function to deploy Redis
deploy_redis() {
    echo -e "${BLUE}🔴 Deploying Redis...${NC}"
    kubectl apply -f redis-deployment.yaml
    echo -e "${GREEN}✅ Redis deployed${NC}"
    
    echo -e "${BLUE}⏳ Waiting for Redis to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s
    echo -e "${GREEN}✅ Redis is ready${NC}"
}

# Function to deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying E-commerce Application...${NC}"
    
    # Update image tag in deployment
    sed "s|pavandoc1990/ecommerce-production-client:latest|${DOCKER_HUB_REPO}-client:${IMAGE_TAG}|g" ecommerce-production.yaml | kubectl apply -f -
    
    echo -e "${GREEN}✅ Application deployed${NC}"
    
    echo -e "${BLUE}⏳ Waiting for application to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=ecommerce -n ${NAMESPACE} --timeout=300s
    echo -e "${GREEN}✅ Application is ready${NC}"
}

# Function to deploy services
deploy_services() {
    echo -e "${BLUE}🌐 Deploying services...${NC}"
    kubectl apply -f ecommerce-service.yaml
    kubectl apply -f ecommerce-ingress.yaml
    echo -e "${GREEN}✅ Services deployed${NC}"
}

# Function to deploy monitoring
deploy_monitoring() {
    echo -e "${BLUE}📊 Deploying monitoring stack...${NC}"
    kubectl apply -f monitoring-stack.yaml
    echo -e "${GREEN}✅ Monitoring deployed${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${BLUE}🔄 Running database migrations...${NC}"
    
    # Get the first pod name
    POD_NAME=$(kubectl get pods -l app=ecommerce -n ${NAMESPACE} -o jsonpath='{.items[0].metadata.name}')
    
    if [ -n "$POD_NAME" ]; then
        echo -e "${BLUE}Running migrations in pod: ${POD_NAME}${NC}"
        kubectl exec -it ${POD_NAME} -n ${NAMESPACE} -- npx prisma migrate deploy
        echo -e "${GREEN}✅ Migrations completed${NC}"
    else
        echo -e "${YELLOW}⚠️ No application pods found, skipping migrations${NC}"
    fi
}

# Function to verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    echo -e "${BLUE}📊 Pod Status:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "${BLUE}🌐 Service Status:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "${BLUE}🔗 Ingress Status:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "${GREEN}✅ Deployment verification completed${NC}"
}

# Function to show access information
show_access_info() {
    echo -e "${BLUE}🌐 Access Information:${NC}"
    echo -e "${BLUE}====================${NC}"
    
    # Get service information
    SERVICE_IP=$(kubectl get service ecommerce-frontend-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
    SERVICE_PORT=$(kubectl get service ecommerce-frontend-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')
    
    echo -e "${GREEN}✅ Application is running at:${NC}"
    echo -e "   Service IP: ${SERVICE_IP}:${SERVICE_PORT}"
    echo -e "   Internal URL: http://${SERVICE_IP}:${SERVICE_PORT}"
    
    # Check if ingress is available
    INGRESS_IP=$(kubectl get ingress ecommerce-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ -n "$INGRESS_IP" ]; then
        echo -e "   External URL: http://${INGRESS_IP}"
    else
        echo -e "   ${YELLOW}⚠️ Ingress not ready yet${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo -e "   View logs: kubectl logs -f deployment/ecommerce-frontend -n ${NAMESPACE}"
    echo -e "   Port forward: kubectl port-forward service/ecommerce-frontend-service 8080:80 -n ${NAMESPACE}"
    echo -e "   Scale app: kubectl scale deployment ecommerce-frontend --replicas=5 -n ${NAMESPACE}"
    echo -e "   Rollback: kubectl rollout undo deployment/ecommerce-frontend -n ${NAMESPACE}"
}

# Main deployment function
main() {
    echo -e "${BLUE}🚀 Production Deployment Started${NC}"
    echo -e "${BLUE}===============================${NC}"
    
    # Pre-deployment checks
    check_kubectl
    check_cluster
    
    # Deployment steps
    create_namespace
    create_secrets
    create_configmaps
    create_rbac
    deploy_database
    deploy_redis
    deploy_application
    deploy_services
    deploy_monitoring
    run_migrations
    verify_deployment
    show_access_info
    
    echo -e "${GREEN}🎉 Production Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
}

# Run main function
main "$@"
