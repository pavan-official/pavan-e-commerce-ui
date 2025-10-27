#!/bin/bash

# 🚀 **Create All Missing YAML Files**
# Complete file creation script for industry-standard structure
# Interview Story: "This creates all the missing ingredients for our recipe"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Creating All Missing YAML Files${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to create base files
create_base_files() {
    echo -e "${BLUE}📁 Creating base files...${NC}"
    
    # Create base directory if it doesn't exist
    mkdir -p base
    
    # Create all base YAML files
    touch base/namespace.yaml
    touch base/configmap.yaml
    touch base/secrets.yaml
    touch base/deployment.yaml
    touch base/service.yaml
    touch base/ingress.yaml
    touch base/kustomization.yaml
    
    echo -e "${GREEN}✅ Base files created${NC}"
}

# Function to create overlay files
create_overlay_files() {
    echo -e "${BLUE}📁 Creating overlay files...${NC}"
    
    # Create dev overlay files
    mkdir -p overlays/dev
    touch overlays/dev/kustomization.yaml
    touch overlays/dev/configmap-patch.yaml
    touch overlays/dev/deployment-patch.yaml
    touch overlays/dev/namespace-patch.yaml
    
    # Create staging overlay files
    mkdir -p overlays/staging
    touch overlays/staging/kustomization.yaml
    touch overlays/staging/configmap-patch.yaml
    touch overlays/staging/deployment-patch.yaml
    touch overlays/staging/namespace-patch.yaml
    
    # Create prod overlay files
    mkdir -p overlays/prod
    touch overlays/prod/kustomization.yaml
    touch overlays/prod/configmap-patch.yaml
    touch overlays/prod/deployment-patch.yaml
    touch overlays/prod/namespace-patch.yaml
    touch overlays/prod/hpa.yaml
    touch overlays/prod/rbac.yaml
    touch overlays/prod/network-policy.yaml
    
    echo -e "${GREEN}✅ Overlay files created${NC}"
}

# Function to create script files
create_script_files() {
    echo -e "${BLUE}📁 Creating script files...${NC}"
    
    # Create scripts directory if it doesn't exist
    mkdir -p scripts
    
    # Create script files
    touch scripts/deploy.sh
    touch scripts/rollback.sh
    touch scripts/health-check.sh
    
    # Make scripts executable
    chmod +x scripts/*.sh
    
    echo -e "${GREEN}✅ Script files created${NC}"
}

# Function to create monitoring files
create_monitoring_files() {
    echo -e "${BLUE}📁 Creating monitoring files...${NC}"
    
    # Create monitoring directory structure
    mkdir -p monitoring/prometheus
    mkdir -p monitoring/grafana
    mkdir -p monitoring/jaeger
    
    # Create monitoring files
    touch monitoring/prometheus/prometheus.yaml
    touch monitoring/grafana/grafana.yaml
    touch monitoring/jaeger/jaeger.yaml
    
    echo -e "${GREEN}✅ Monitoring files created${NC}"
}

# Function to create security files
create_security_files() {
    echo -e "${BLUE}📁 Creating security files...${NC}"
    
    # Create security directory if it doesn't exist
    mkdir -p security
    
    # Create security files
    touch security/rbac.yaml
    touch security/network-policies.yaml
    touch security/psp.yaml
    
    echo -e "${GREEN}✅ Security files created${NC}"
}

# Function to verify structure
verify_structure() {
    echo -e "${BLUE}🔍 Verifying structure...${NC}"
    
    echo -e "${BLUE}📊 File Count:${NC}"
    find . -name "*.yaml" | wc -l
    find . -name "*.sh" | wc -l
    
    echo -e "${BLUE}📁 Directory Structure:${NC}"
    find . -type d | sort
    
    echo -e "${GREEN}✅ Structure verification completed${NC}"
}

# Main function
main() {
    echo -e "${BLUE}🚀 Starting file creation...${NC}"
    
    create_base_files
    create_overlay_files
    create_script_files
    create_monitoring_files
    create_security_files
    verify_structure
    
    echo -e "${GREEN}🎉 All files created successfully!${NC}"
    echo -e "${GREEN}===============================${NC}"
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo -e "   1. Add content to the YAML files"
    echo -e "   2. Test deployment with: ./scripts/deploy.sh dev latest"
    echo -e "   3. Update CI/CD pipeline to use new paths"
}

# Run main function
main "$@"
