#!/bin/bash

# ==================================================================================================
# MONITORING STACK DEPLOYMENT SCRIPT - KUBERNETES
# ==================================================================================================
#
# Purpose: Deploy complete monitoring stack (Prometheus, Grafana, AlertManager, Jaeger)
# Why: Essential for production observability, alerting, and performance monitoring
#
# Interview Topics:
# - Infrastructure as Code for monitoring
# - Service discovery and configuration
# - Persistent storage management
# - Security and RBAC
# - Health checks and validation
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
# IMPORTANT: Monitoring stack ALWAYS deploys to 'monitoring' namespace
# regardless of the application namespace
NAMESPACE=monitoring
TIMEOUT=${DEPLOYMENT_TIMEOUT:-300}

echo -e "${BLUE}🚀 Starting Monitoring Stack Deployment${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}Timeout: ${TIMEOUT}s${NC}"

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

# Function to deploy Prometheus
deploy_prometheus() {
    echo -e "${BLUE}📊 Deploying Prometheus...${NC}"
    
    # Apply Prometheus manifests
    kubectl apply -f prometheus.yaml -n $NAMESPACE
    
    # Wait for Prometheus to be ready
    echo -e "${YELLOW}⏳ Waiting for Prometheus to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=${TIMEOUT}s deployment/prometheus -n $NAMESPACE
    
    echo -e "${GREEN}✅ Prometheus deployed successfully${NC}"
}

# Function to deploy AlertManager
deploy_alertmanager() {
    echo -e "${BLUE}🚨 Deploying AlertManager...${NC}"
    
    # Apply AlertManager manifests
    kubectl apply -f alertmanager.yaml -n $NAMESPACE
    
    # Wait for AlertManager to be ready
    echo -e "${YELLOW}⏳ Waiting for AlertManager to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=${TIMEOUT}s deployment/alertmanager -n $NAMESPACE
    
    echo -e "${GREEN}✅ AlertManager deployed successfully${NC}"
}

# Function to deploy Grafana
deploy_grafana() {
    echo -e "${BLUE}📈 Deploying Grafana...${NC}"
    
    # Apply Grafana manifests
    kubectl apply -f grafana.yaml -n $NAMESPACE
    
    # Wait for Grafana to be ready
    echo -e "${YELLOW}⏳ Waiting for Grafana to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=${TIMEOUT}s deployment/grafana -n $NAMESPACE
    
    echo -e "${GREEN}✅ Grafana deployed successfully${NC}"
}

# Function to deploy Jaeger
deploy_jaeger() {
    echo -e "${BLUE}🔍 Deploying Jaeger...${NC}"
    
    # Apply Jaeger manifests
    kubectl apply -f jaeger.yaml -n $NAMESPACE
    
    # Wait for Jaeger to be ready
    echo -e "${YELLOW}⏳ Waiting for Jaeger to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=${TIMEOUT}s deployment/jaeger -n $NAMESPACE
    
    echo -e "${GREEN}✅ Jaeger deployed successfully${NC}"
}

# Function to deploy DataDog
deploy_datadog() {
    echo -e "${BLUE}🐕 Deploying DataDog Agent...${NC}"
    
    # Check if DataDog API key is provided
    if [ -z "${DATADOG_API_KEY:-}" ]; then
        echo -e "${YELLOW}⚠️  DATADOG_API_KEY not provided, skipping DataDog deployment${NC}"
        echo -e "${YELLOW}   Set DATADOG_API_KEY environment variable to enable DataDog${NC}"
        return 0
    fi
    
    # Create DataDog secret
    kubectl create secret generic datadog-secret \
        --from-literal=api-key="${DATADOG_API_KEY}" \
        --from-literal=postgres-password="${POSTGRES_PASSWORD:-postgres}" \
        -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply DataDog manifests
    kubectl apply -f datadog.yaml -n $NAMESPACE
    
    # Wait for DataDog to be ready
    echo -e "${YELLOW}⏳ Waiting for DataDog Agent to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=${TIMEOUT}s daemonset/datadog-agent -n $NAMESPACE
    
    echo -e "${GREEN}✅ DataDog Agent deployed successfully${NC}"
}

# Function to verify monitoring stack
verify_monitoring_stack() {
    echo -e "${BLUE}🔍 Verifying monitoring stack...${NC}"
    
    # Check deployments
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    kubectl get deployments -n $NAMESPACE
    
    # Check services
    echo -e "${BLUE}🌐 Service Status:${NC}"
    kubectl get services -n $NAMESPACE
    
    # Check persistent volume claims
    echo -e "${BLUE}💾 Storage Status:${NC}"
    kubectl get pvc -n $NAMESPACE
    
    # Check ingress
    echo -e "${BLUE}🔗 Ingress Status:${NC}"
    kubectl get ingress -n $NAMESPACE
    
    echo -e "${GREEN}✅ Monitoring stack verification completed${NC}"
}

# Function to run health checks
run_health_checks() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Prometheus health check
    echo -e "${BLUE}📊 Checking Prometheus health...${NC}"
    kubectl port-forward service/prometheus 9090:9090 -n $NAMESPACE &
    PROMETHEUS_PID=$!
    sleep 5
    
    if curl -f http://localhost:9090/-/healthy &> /dev/null; then
        echo -e "${GREEN}✅ Prometheus is healthy${NC}"
    else
        echo -e "${RED}❌ Prometheus health check failed${NC}"
    fi
    kill $PROMETHEUS_PID 2>/dev/null || true
    
    # Grafana health check
    echo -e "${BLUE}📈 Checking Grafana health...${NC}"
    kubectl port-forward service/grafana 3000:3000 -n $NAMESPACE &
    GRAFANA_PID=$!
    sleep 5
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        echo -e "${GREEN}✅ Grafana is healthy${NC}"
    else
        echo -e "${RED}❌ Grafana health check failed${NC}"
    fi
    kill $GRAFANA_PID 2>/dev/null || true
    
    # AlertManager health check
    echo -e "${BLUE}🚨 Checking AlertManager health...${NC}"
    kubectl port-forward service/alertmanager 9093:9093 -n $NAMESPACE &
    ALERTMANAGER_PID=$!
    sleep 5
    
    if curl -f http://localhost:9093/-/healthy &> /dev/null; then
        echo -e "${GREEN}✅ AlertManager is healthy${NC}"
    else
        echo -e "${RED}❌ AlertManager health check failed${NC}"
    fi
    kill $ALERTMANAGER_PID 2>/dev/null || true
    
    # Jaeger health check
    echo -e "${BLUE}🔍 Checking Jaeger health...${NC}"
    kubectl port-forward service/jaeger 16686:16686 -n $NAMESPACE &
    JAEGER_PID=$!
    sleep 5
    
    if curl -f http://localhost:16686 &> /dev/null; then
        echo -e "${GREEN}✅ Jaeger is healthy${NC}"
    else
        echo -e "${RED}❌ Jaeger health check failed${NC}"
    fi
    kill $JAEGER_PID 2>/dev/null || true
    
    echo -e "${GREEN}✅ All health checks completed${NC}"
}

# Function to show access information
show_access_info() {
    echo -e "${BLUE}🌐 Monitoring Stack Access Information:${NC}"
    echo ""
    echo -e "${YELLOW}📊 Prometheus:${NC}"
    echo "  URL: http://prometheus.local (or kubectl port-forward service/prometheus 9090:9090 -n $NAMESPACE)"
    echo "  Purpose: Metrics collection and querying"
    echo ""
    echo -e "${YELLOW}📈 Grafana:${NC}"
    echo "  URL: http://grafana.local (or kubectl port-forward service/grafana 3000:3000 -n $NAMESPACE)"
    echo "  Credentials: admin / admin123"
    echo "  Purpose: Dashboards and visualization"
    echo ""
    echo -e "${YELLOW}🚨 AlertManager:${NC}"
    echo "  URL: http://alertmanager.local (or kubectl port-forward service/alertmanager 9093:9093 -n $NAMESPACE)"
    echo "  Purpose: Alert routing and notifications"
    echo ""
    echo -e "${YELLOW}🔍 Jaeger:${NC}"
    echo "  URL: http://jaeger.local (or kubectl port-forward service/jaeger 16686:16686 -n $NAMESPACE)"
    echo "  Purpose: Distributed tracing"
    echo ""
    echo -e "${GREEN}🎉 Monitoring stack deployment completed successfully!${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}🚀 Starting Monitoring Stack Deployment${NC}"
    
    check_kubectl
    check_namespace
    deploy_prometheus
    deploy_alertmanager
    deploy_grafana
    deploy_jaeger
    deploy_datadog
    verify_monitoring_stack
    run_health_checks
    show_access_info
    
    echo -e "${GREEN}🎉 Monitoring stack deployment completed successfully!${NC}"
}

# Run main function
main "$@"
