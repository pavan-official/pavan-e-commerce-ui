# 🚀 **Production Deployment Guide**

## 📋 **Overview**

This guide provides complete instructions for deploying the e-commerce application to production using Kubernetes, Docker Hub, and CI/CD pipelines.

## 🎯 **What We've Built**

### ✅ **Complete Production Stack**
- **Frontend**: Next.js application with TypeScript
- **Backend**: API routes with PostgreSQL and Redis
- **Database**: PostgreSQL with high availability
- **Cache**: Redis for session management and caching
- **Monitoring**: Prometheus, Grafana, Jaeger
- **Security**: RBAC, Network Policies, SSL/TLS
- **CI/CD**: GitHub Actions with Docker Hub integration

### ✅ **Multi-Environment Support**
- **Development**: `ecommerce-dev` namespace
- **Staging**: `ecommerce-staging` namespace  
- **Production**: `ecommerce-production` namespace

### ✅ **Production Features**
- **High Availability**: Multiple replicas with anti-affinity
- **Auto-scaling**: Horizontal Pod Autoscaler (HPA)
- **Rolling Updates**: Zero-downtime deployments
- **Health Checks**: Liveness, readiness, and startup probes
- **Resource Limits**: CPU and memory constraints
- **Security**: RBAC, Network Policies, Secrets management
- **Monitoring**: Complete observability stack

## 🚀 **Quick Start**

### **1. Prerequisites**
```bash
# Required tools
kubectl
docker
git

# Required access
Docker Hub account (pavandoc1990)
Kubernetes cluster (minikube, EKS, GKE, AKS)
GitHub repository with secrets configured
```

### **2. Configure Secrets**
```bash
# GitHub Secrets (configure in repository settings)
DOCKER_HUB_USERNAME: your-dockerhub-username
DOCKER_HUB_TOKEN: your-dockerhub-token
KUBE_CONFIG: <base64-encoded-kubeconfig>
```

### **3. Deploy to Production**
```bash
# Clone repository
git clone <your-repo>
cd e-commerce-ui

# Deploy to production
cd kubernetes-interview-prep/manifests
./deploy-production.sh latest
```

## 📁 **File Structure**

```
kubernetes-interview-prep/manifests/
├── production/
│   ├── ecommerce-production.yaml      # Main application deployment
│   ├── production-secrets.yaml         # Sensitive configuration
│   ├── production-configmap.yaml       # Non-sensitive configuration
│   ├── postgres-production.yaml        # Database deployment
│   └── ecommerce-service.yaml         # Services and ingress
├── environments/
│   ├── dev/namespace.yaml              # Development namespace
│   ├── staging/namespace.yaml          # Staging namespace
│   └── prod/namespace.yaml             # Production namespace
├── deploy-production.sh                # Deployment script
└── PRODUCTION-DEPLOYMENT-GUIDE.md     # This guide
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ecommerce.yourdomain.com
DATABASE_URL=postgresql://ecommerce:password@postgres-service:5432/ecommerce_db
REDIS_URL=redis://redis-service:6379

# Security
NEXTAUTH_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **Resource Limits**
```yaml
resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi
```

### **Scaling Configuration**
```yaml
# Horizontal Pod Autoscaler
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70
```

## 🐳 **Docker Hub Integration**

### **Image Tags**
```bash
# Production images
pavandoc1990/ecommerce-production-client:latest
pavandoc1990/ecommerce-production-client:v1.0.0
pavandoc1990/ecommerce-production-admin:latest
pavandoc1990/ecommerce-production-admin:v1.0.0
```

### **CI/CD Pipeline**
```yaml
# Automatic deployment on:
- Push to main branch
- Version tags (v*.*.*)
- Manual workflow dispatch
```

## ☸️ **Kubernetes Deployment**

### **Namespaces**
```bash
# Development
kubectl get pods -n ecommerce-dev

# Staging  
kubectl get pods -n ecommerce-staging

# Production
kubectl get pods -n ecommerce-production
```

### **Services**
```bash
# Application service
kubectl get service ecommerce-frontend-service -n ecommerce-production

# Database service
kubectl get service postgres-service -n ecommerce-production

# Redis service
kubectl get service redis-service -n ecommerce-production
```

### **Ingress**
```bash
# External access
kubectl get ingress ecommerce-ingress -n ecommerce-production
```

## 📊 **Monitoring & Observability**

### **Prometheus Metrics**
```bash
# Access Prometheus
kubectl port-forward service/prometheus-service 9090:9090 -n ecommerce-production
# Open: http://localhost:9090
```

### **Grafana Dashboards**
```bash
# Access Grafana
kubectl port-forward service/grafana-service 3000:3000 -n ecommerce-production
# Open: http://localhost:3000
# Login: admin/admin123
```

### **Jaeger Tracing**
```bash
# Access Jaeger
kubectl port-forward service/jaeger-service 16686:16686 -n ecommerce-production
# Open: http://localhost:16686
```

## 🔒 **Security Features**

### **RBAC (Role-Based Access Control)**
```yaml
# ServiceAccount: ecommerce-frontend
# Role: ecommerce-frontend-role
# RoleBinding: ecommerce-frontend-rolebinding
```

### **Network Policies**
```yaml
# Restrict network access
# Allow only necessary communication
# Block unnecessary traffic
```

### **Secrets Management**
```yaml
# Database credentials
# API keys
# SSL certificates
# JWT secrets
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Pod Not Starting**
```bash
# Check pod status
kubectl get pods -n ecommerce-production

# Check pod logs
kubectl logs -f deployment/ecommerce-frontend -n ecommerce-production

# Check pod events
kubectl describe pod <pod-name> -n ecommerce-production
```

#### **2. Database Connection Issues**
```bash
# Check database status
kubectl get pods -l app=postgres -n ecommerce-production

# Check database logs
kubectl logs -f statefulset/postgres -n ecommerce-production

# Test database connection
kubectl exec -it <pod-name> -n ecommerce-production -- psql -h postgres-service -U ecommerce -d ecommerce_db
```

#### **3. Image Pull Issues**
```bash
# Check image availability
docker pull pavandoc1990/ecommerce-production-client:latest

# Check image tags
kubectl describe pod <pod-name> -n ecommerce-production
```

### **Useful Commands**
```bash
# View all resources
kubectl get all -n ecommerce-production

# Check resource usage
kubectl top pods -n ecommerce-production

# Scale application
kubectl scale deployment ecommerce-frontend --replicas=5 -n ecommerce-production

# Rollback deployment
kubectl rollout undo deployment/ecommerce-frontend -n ecommerce-production

# Port forward for testing
kubectl port-forward service/ecommerce-frontend-service 8080:80 -n ecommerce-production
```

## 🔄 **Deployment Strategies**

### **Rolling Updates**
```bash
# Update image
kubectl set image deployment/ecommerce-frontend ecommerce-app=pavandoc1990/ecommerce-production-client:v1.1.0 -n ecommerce-production

# Check rollout status
kubectl rollout status deployment/ecommerce-frontend -n ecommerce-production

# Rollback if needed
kubectl rollout undo deployment/ecommerce-frontend -n ecommerce-production
```

### **Blue-Green Deployment**
```bash
# Deploy new version
kubectl apply -f ecommerce-production-v2.yaml

# Switch traffic
kubectl patch service ecommerce-frontend-service -p '{"spec":{"selector":{"version":"v2"}}}'
```

## 📈 **Performance Optimization**

### **Resource Optimization**
```yaml
# CPU and memory limits
# Horizontal Pod Autoscaler
# Vertical Pod Autoscaler
# Cluster Autoscaler
```

### **Caching Strategy**
```yaml
# Redis for session management
# CDN for static assets
# Database query optimization
# Application-level caching
```

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Configure domain name** (when available)
2. **Set up SSL certificates**
3. **Configure production database**
4. **Set up monitoring alerts**
5. **Configure backup strategies**

### **Future Enhancements**
1. **Multi-region deployment**
2. **Service mesh (Istio)**
3. **Advanced monitoring**
4. **Disaster recovery**
5. **Cost optimization**

## 📞 **Support**

### **Documentation**
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### **Troubleshooting Resources**
- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug-application-cluster/)
- [Docker Troubleshooting](https://docs.docker.com/config/troubleshooting/)

---

## 🎉 **Congratulations!**

You now have a complete production-ready e-commerce application deployed on Kubernetes with:

✅ **Docker Hub integration**  
✅ **Multi-environment support**  
✅ **Production-grade security**  
✅ **Complete monitoring stack**  
✅ **Automated CI/CD pipeline**  
✅ **High availability configuration**  

**Your application is ready for production traffic!** 🚀
