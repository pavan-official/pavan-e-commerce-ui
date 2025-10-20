#!/bin/bash

# 🚀 **Industry-Standard Deployment Script**
# Complete deployment automation with Kustomize
# Interview Story: "This is our automated deployment system that handles everything"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-dev}"
IMAGE_TAG="${2:-latest}"
NAMESPACE="ecommerce-${ENVIRONMENT}"

echo -e "${BLUE}🚀 Starting ${ENVIRONMENT} Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Environment: ${ENVIRONMENT}"
echo -e "Namespace: ${NAMESPACE}"
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

# Function to check if kustomize is available
check_kustomize() {
    if ! command -v kustomize &> /dev/null; then
        echo -e "${YELLOW}⚠️ kustomize not found, installing...${NC}"
        # Install kustomize
        curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
        sudo mv kustomize /usr/local/bin/
    fi
    echo -e "${GREEN}✅ kustomize is available${NC}"
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

# Function to validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|prod)
            echo -e "${GREEN}✅ Valid environment: ${ENVIRONMENT}${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid environment: ${ENVIRONMENT}${NC}"
            echo -e "${YELLOW}💡 Valid environments: dev, staging, prod${NC}"
            exit 1
            ;;
    esac
}

# Function to update image tag
update_image_tag() {
    echo -e "${BLUE}🔄 Updating image tag to ${IMAGE_TAG}...${NC}"
    
    # Update image tag in kustomization.yaml
    sed -i.bak "s/newTag: .*/newTag: ${IMAGE_TAG}/" overlays/${ENVIRONMENT}/kustomization.yaml
    
    echo -e "${GREEN}✅ Image tag updated${NC}"
}

# Function to deploy with kustomize
deploy_with_kustomize() {
    echo -e "${BLUE}🚀 Deploying with Kustomize...${NC}"
    
    # Deploy using kustomize
    kubectl apply -k overlays/${ENVIRONMENT}
    
    echo -e "${GREEN}✅ Deployment completed${NC}"
}

# Function to wait for deployment
wait_for_deployment() {
    echo -e "${BLUE}⏳ Waiting for deployment to be ready...${NC}"
    
    kubectl wait --for=condition=ready pod -l app=ecommerce -n ${NAMESPACE} --timeout=300s
    
    echo -e "${GREEN}✅ Deployment is ready${NC}"
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
    SERVICE_IP=$(kubectl get service ecommerce-frontend-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "N/A")
    SERVICE_PORT=$(kubectl get service ecommerce-frontend-service -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "N/A")
    
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
    echo -e "${BLUE}🚀 ${ENVIRONMENT} Deployment Started${NC}"
    echo -e "${BLUE}===============================${NC}"
    
    # Pre-deployment checks
    check_kubectl
    check_kustomize
    check_cluster
    validate_environment
    
    # Deployment steps
    update_image_tag
    deploy_with_kustomize
    wait_for_deployment
    verify_deployment
    show_access_info
    
    echo -e "${GREEN}🎉 ${ENVIRONMENT} Deployment Completed Successfully!${NC}"
    echo -e "${GREEN}============================================${NC}"
}

# Run main function
main "$@"