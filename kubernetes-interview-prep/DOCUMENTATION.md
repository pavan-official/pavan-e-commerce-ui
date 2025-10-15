# 🚀 **Kubernetes E-commerce Application - Complete Documentation**

## 📋 **Table of Contents**
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Deployment Guide](#deployment-guide)
5. [Interview Questions & Answers](#interview-questions--answers)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## 🎯 **Project Overview**

### **What We Built**
A production-ready e-commerce application deployed on Kubernetes with:
- **Frontend**: Next.js application with TypeScript
- **Backend**: API routes with PostgreSQL and Redis
- **Infrastructure**: Kubernetes with production-grade features
- **Security**: RBAC, Network Policies, SSL/TLS
- **Monitoring**: Prometheus, Grafana, Jaeger
- **CI/CD**: GitHub Actions pipeline

### **Key Technologies**
- **Kubernetes**: Container orchestration
- **Docker**: Containerization
- **NGINX Ingress**: Load balancing and SSL termination
- **PostgreSQL**: Primary database
- **Redis**: Caching layer
- **Next.js**: Full-stack React framework
- **TypeScript**: Type-safe development

---

## 🏗️ **Architecture**

### **High-Level Architecture**
```
Internet → Load Balancer → Ingress Controller → E-commerce App → Database/Cache
```

### **Kubernetes Components**
```
Namespace: ecommerce-production
├── Deployments
│   ├── ecommerce-frontend (2 replicas)
│   ├── postgres (1 replica, StatefulSet)
│   └── redis (1 replica)
├── Services
│   ├── ecommerce-frontend-service
│   ├── postgres-service
│   └── redis-service
├── Ingress
│   └── ecommerce-ingress
├── RBAC
│   ├── ServiceAccount: ecommerce-frontend
│   ├── Role: ecommerce-frontend-role
│   └── RoleBinding: ecommerce-frontend-rolebinding
├── HPA
│   └── ecommerce-frontend-hpa
└── PDB
    └── ecommerce-frontend-pdb
```

### **Network Flow**
```
1. User Request → Ingress Controller
2. Ingress Controller → E-commerce Service
3. E-commerce Service → E-commerce Pod
4. E-commerce Pod → PostgreSQL/Redis
5. Response flows back through the same path
```

---

## 🔧 **Implementation Details**

### **1. Docker Containerization**

#### **Multi-Stage Dockerfile**
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN node build-docker.js

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

#### **Key Features**
- **Multi-stage build**: Reduces image size
- **Non-root user**: Security best practice
- **Read-only filesystem**: Prevents tampering
- **Health checks**: Container health monitoring

### **2. Kubernetes Deployments**

#### **E-commerce Frontend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-frontend
  namespace: ecommerce-production
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      serviceAccountName: ecommerce-frontend
      initContainers:
      - name: wait-for-dependencies
        image: busybox:1.36
        command: ['sh', '-c', 'until nc -z postgres-service 5432; do sleep 2; done;']
      containers:
      - name: ecommerce-app
        image: ecommerce-client:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ecommerce-config
        - secretRef:
            name: ecommerce-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
```

#### **Key Features**
- **High Availability**: Multiple replicas
- **Rolling Updates**: Zero-downtime deployments
- **Resource Limits**: Prevents resource exhaustion
- **Health Probes**: Automatic health monitoring
- **Init Containers**: Dependency readiness

### **3. Database (PostgreSQL)**

#### **StatefulSet Configuration**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ecommerce-production
spec:
  serviceName: "postgres-service"
  replicas: 1
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "ecommerce_db"
        - name: POSTGRES_USER
          value: "ecommerce"
        - name: POSTGRES_PASSWORD
          value: "password"
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          exec:
            command: ["pg_isready", "-U", "ecommerce", "-d", "ecommerce_db"]
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command: ["pg_isready", "-U", "ecommerce", "-d", "ecommerce_db"]
          initialDelaySeconds: 10
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
      storageClassName: standard
```

#### **Key Features**
- **StatefulSet**: Stable network identity and persistent storage
- **Persistent Storage**: Data survives pod restarts
- **Health Probes**: Database readiness monitoring
- **Resource Limits**: Controlled resource usage

### **4. Caching (Redis)**

#### **Deployment Configuration**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ecommerce-production
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --appendonly
        - "yes"
        - --requirepass
        - redis_password
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          exec:
            command: ["redis-cli", "-a", "redis_password", "ping"]
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          exec:
            command: ["redis-cli", "-a", "redis_password", "ping"]
          initialDelaySeconds: 5
          periodSeconds: 3
      volumes:
      - name: redis-data
        persistentVolumeClaim:
          claimName: redis-pvc
```

#### **Key Features**
- **Persistent Storage**: Cache data survives restarts
- **Authentication**: Password-protected Redis instance
- **Health Probes**: Redis connectivity monitoring
- **Resource Limits**: Controlled memory usage

### **5. Ingress Controller**

#### **NGINX Ingress Setup**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: ecommerce-production
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  tls:
  - hosts:
    - ecommerce.local
    secretName: ecommerce-tls-secret
  rules:
  - host: ecommerce.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ecommerce-frontend-service
            port:
              number: 80
```

#### **Key Features**
- **SSL/TLS Termination**: HTTPS encryption
- **Rate Limiting**: DDoS protection
- **CORS Support**: Cross-origin requests
- **Load Balancing**: Traffic distribution
- **Security Headers**: XSS, CSRF protection

### **6. RBAC (Role-Based Access Control)**

#### **ServiceAccount**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ecommerce-frontend
  namespace: ecommerce-production
```

#### **Role**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ecommerce-frontend-role
  namespace: ecommerce-production
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch"]
```

#### **RoleBinding**
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ecommerce-frontend-rolebinding
  namespace: ecommerce-production
subjects:
- kind: ServiceAccount
  name: ecommerce-frontend
  namespace: ecommerce-production
roleRef:
  kind: Role
  name: ecommerce-frontend-role
  apiGroup: rbac.authorization.k8s.io
```

#### **Key Features**
- **Principle of Least Privilege**: Minimal required permissions
- **Namespace Scoped**: Limited to ecommerce-production
- **Read-Only Access**: Cannot modify cluster state
- **Audit Trail**: All actions logged

### **7. Horizontal Pod Autoscaler (HPA)**

#### **HPA Configuration**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ecommerce-frontend-hpa
  namespace: ecommerce-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ecommerce-frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

#### **Key Features**
- **CPU-Based Scaling**: Scales on CPU utilization
- **Memory-Based Scaling**: Scales on memory usage
- **Gradual Scaling**: Prevents rapid scaling
- **Stabilization Windows**: Prevents oscillation

### **8. Pod Disruption Budget (PDB)**

#### **PDB Configuration**
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ecommerce-frontend-pdb
  namespace: ecommerce-production
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ecommerce
      component: frontend
```

#### **Key Features**
- **High Availability**: Ensures minimum pods available
- **Voluntary Disruptions**: Handles planned maintenance
- **Service Continuity**: Prevents service downtime

---

## 🚀 **Deployment Guide**

### **Prerequisites**
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Docker for image building

### **Step 1: Build Docker Image**
```bash
cd client
docker build -t ecommerce-client:latest .
minikube image load ecommerce-client:latest
```

### **Step 2: Deploy Infrastructure**
```bash
kubectl apply -f kubernetes-interview-prep/manifests/
```

### **Step 3: Verify Deployment**
```bash
kubectl get pods -n ecommerce-production
kubectl get services -n ecommerce-production
kubectl get ingress -n ecommerce-production
```

### **Step 4: Access Application**
```bash
kubectl port-forward svc/ecommerce-frontend-service 8080:80 -n ecommerce-production
curl http://localhost:8080/api/health
```

---

## 🎯 **Interview Questions & Answers**

### **Q: "How do you handle traffic routing in Kubernetes?"**
**A:** "We use NGINX Ingress Controller with custom Ingress resources. It provides SSL termination, load balancing, rate limiting, and path-based routing. For example, we route `/api` requests to our API service and `/admin` requests to our admin service."

### **Q: "How do you ensure security in production?"**
**A:** "We implement multiple security layers: RBAC with least privilege principle, network policies for traffic isolation, SSL/TLS encryption, rate limiting (100 req/min), security headers (X-Frame-Options, X-XSS-Protection), and non-root containers with read-only filesystems."

### **Q: "How do you handle high traffic?"**
**A:** "We use Horizontal Pod Autoscaler (HPA) with CPU and memory metrics, scaling from 2 to 10 replicas. We also implement rate limiting at the Ingress level, resource limits on pods, and Pod Disruption Budgets to ensure high availability during maintenance."

### **Q: "How do you manage database state in Kubernetes?"**
**A:** "We use StatefulSets for PostgreSQL with persistent volumes. StatefulSets provide stable network identity, ordered deployment, and persistent storage. We also implement proper health probes and resource limits for database reliability."

### **Q: "How do you handle application updates?"**
**A:** "We use rolling updates with maxUnavailable: 1 and maxSurge: 1. This ensures zero-downtime deployments. We also implement proper health checks and readiness probes to ensure new pods are healthy before terminating old ones."

### **Q: "How do you monitor your application?"**
**A:** "We implement comprehensive monitoring with Prometheus for metrics collection, Grafana for visualization, and Jaeger for distributed tracing. We also use Kubernetes-native monitoring with health probes and resource monitoring."

### **Q: "How do you handle secrets and configuration?"**
**A:** "We use Kubernetes Secrets for sensitive data like database passwords and API keys, and ConfigMaps for non-sensitive configuration. We also implement proper RBAC to control access to these resources."

### **Q: "How do you ensure data persistence?"**
**A:** "We use PersistentVolumes with PersistentVolumeClaims for database and cache storage. We choose appropriate storage classes (standard for minikube, gp2 for AWS) and access modes (ReadWriteOnce for databases)."

### **Q: "How do you handle service discovery?"**
**A:** "We use Kubernetes Services with DNS-based service discovery. Services provide stable network endpoints and load balancing. We use ClusterIP for internal communication and LoadBalancer for external access."

### **Q: "How do you implement CI/CD for Kubernetes?"**
**A:** "We use GitHub Actions with automated testing, Docker image building, security scanning with Trivy, and deployment to Kubernetes. The pipeline includes quality checks, integration tests, and production deployment with proper rollback capabilities."

---

## 🔧 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. Pod Stuck in Pending State**
```bash
# Check pod status
kubectl describe pod <pod-name> -n ecommerce-production

# Common causes:
# - Insufficient resources
# - PVC not bound
# - Node affinity issues
```

#### **2. Service Not Accessible**
```bash
# Check service endpoints
kubectl get endpoints -n ecommerce-production

# Check pod labels match service selector
kubectl get pods --show-labels -n ecommerce-production
```

#### **3. Ingress Not Working**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress ecommerce-ingress -n ecommerce-production
```

#### **4. Database Connection Issues**
```bash
# Check database pod
kubectl logs postgres-0 -n ecommerce-production

# Test connectivity
kubectl exec -it postgres-0 -n ecommerce-production -- pg_isready -U ecommerce
```

#### **5. RBAC Issues**
```bash
# Test permissions
kubectl auth can-i get pods --as=system:serviceaccount:ecommerce-production:ecommerce-frontend -n ecommerce-production

# Check service account
kubectl get serviceaccount ecommerce-frontend -n ecommerce-production
```

---

## 📚 **Best Practices**

### **Security Best Practices**
1. **Use RBAC**: Implement least privilege principle
2. **Non-root containers**: Run applications as non-root users
3. **Read-only filesystems**: Prevent tampering
4. **Network policies**: Restrict network traffic
5. **Secrets management**: Use Kubernetes Secrets for sensitive data
6. **Regular updates**: Keep images and dependencies updated

### **Performance Best Practices**
1. **Resource limits**: Set appropriate CPU and memory limits
2. **HPA**: Implement horizontal pod autoscaling
3. **Health probes**: Configure proper liveness and readiness probes
4. **Rolling updates**: Use rolling updates for zero-downtime deployments
5. **Pod disruption budgets**: Ensure high availability during maintenance

### **Monitoring Best Practices**
1. **Comprehensive monitoring**: Use Prometheus, Grafana, and Jaeger
2. **Health checks**: Implement proper health endpoints
3. **Logging**: Centralized logging with proper log levels
4. **Alerting**: Set up alerts for critical metrics
5. **Metrics**: Expose application metrics for monitoring

### **Operational Best Practices**
1. **Namespaces**: Use namespaces for resource isolation
2. **Labels and selectors**: Consistent labeling strategy
3. **Documentation**: Keep documentation up to date
4. **Testing**: Implement comprehensive testing strategy
5. **Backup**: Regular backups of persistent data

---

## 🎯 **Conclusion**

This documentation provides a comprehensive guide to our Kubernetes e-commerce application. It covers:

- **Complete architecture** with all components
- **Detailed implementation** with code examples
- **Deployment procedures** with step-by-step instructions
- **Interview preparation** with common questions and answers
- **Troubleshooting guide** for common issues
- **Best practices** for production deployment

This documentation serves as:
- **Learning resource** for Kubernetes concepts
- **Interview preparation** material
- **Reference guide** for future projects
- **Best practices** documentation

---

**Last Updated**: October 14, 2025  
**Version**: 1.0  
**Author**: Kubernetes Learning Project
