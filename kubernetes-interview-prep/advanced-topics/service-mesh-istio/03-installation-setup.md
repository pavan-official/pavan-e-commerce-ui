# 🛠️ **Istio Installation and Setup - Step by Step**

## 🎓 **Learning: Istio Installation Process**

### **Real-World Analogy:**
*"Installing Istio is like setting up a smart city's traffic management system. First, you install the control center (Istiod), then you configure the traffic lights (Envoy proxies) at each intersection, and finally you test that everything works together."*

## 🚀 **Prerequisites**

### **System Requirements**
```bash
# Check Kubernetes version
kubectl version --client
# Client Version: version.Info{Major:"1", Minor:"28", GitVersion:"v1.28.0"}

# Check cluster version
kubectl version --short
# Client Version: v1.28.0
# Server Version: v1.28.0
```

**Requirements:**
- **Kubernetes**: 1.24 or later
- **CPU**: 2 cores minimum
- **Memory**: 4GB minimum
- **Storage**: 10GB minimum

### **Cluster Setup**
```bash
# For local development (minikube)
minikube start --memory=8192 --cpus=4

# For local development (kind)
kind create cluster --config=kind-config.yaml

# For cloud (EKS, GKE, AKS)
# Use managed Kubernetes service
```

## 🛠️ **Step 1: Download Istio**

### **Download Istio**
```bash
# Download latest Istio
curl -L https://istio.io/downloadIstio | sh -

# Move to PATH
cd istio-1.19.0
export PATH=$PWD/bin:$PATH

# Verify installation
istioctl version
# client version: 1.19.0
# control plane version: (not installed)
```

### **Alternative: Using Helm**
```bash
# Add Istio Helm repository
helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

# Install Istio base
helm install istio-base istio/base -n istio-system --create-namespace

# Install Istiod
helm install istiod istio/istiod -n istio-system --wait
```

## 🛠️ **Step 2: Install Istio Control Plane**

### **Default Installation**
```bash
# Install Istio with default profile
istioctl install --set values.defaultRevision=default

# Verify installation
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# istiod-7c4d4b8c5d-abc123                1/1     Running   0
# istio-ingressgateway-7d4f8b9c2e-def456  1/1     Running   0
```

### **Custom Installation**
```bash
# Install with custom configuration
istioctl install \
  --set values.pilot.resources.requests.memory=1Gi \
  --set values.pilot.resources.requests.cpu=500m \
  --set values.global.proxy.resources.requests.memory=128Mi \
  --set values.global.proxy.resources.requests.cpu=100m
```

### **Production Installation**
```bash
# Install with production profile
istioctl install --set profile=production

# Verify production installation
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# istiod-7c4d4b8c5d-abc123                1/1     Running   0
# istio-ingressgateway-7d4f8b9c2e-def456  1/1     Running   0
# istio-egressgateway-8e5f9c0d3f-ghi789   1/1     Running   0
```

## 🛠️ **Step 3: Enable Sidecar Injection**

### **Automatic Sidecar Injection**
```bash
# Enable automatic sidecar injection for default namespace
kubectl label namespace default istio-injection=enabled

# Verify label
kubectl get namespace default --show-labels
# NAME      STATUS   AGE   LABELS
# default   Active   1d    istio-injection=enabled
```

### **Manual Sidecar Injection**
```bash
# Inject sidecar into existing deployment
kubectl get deployment ecommerce-frontend -o yaml | istioctl kube-inject -f - | kubectl apply -f -

# Verify sidecar injection
kubectl get pods
# NAME                                READY   STATUS    RESTARTS
# ecommerce-frontend-abc123-xyz789    2/2     Running   0
```

## 🛠️ **Step 4: Deploy Sample Application**

### **Deploy Bookinfo Application**
```bash
# Deploy sample application
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/bookinfo/platform/kube/bookinfo.yaml

# Verify deployment
kubectl get pods
# NAME                              READY   STATUS    RESTARTS
# productpage-v1-7c4d4b8c5d-abc123  2/2     Running   0
# details-v1-7d4f8b9c2e-def456      2/2     Running   0
# reviews-v1-8e5f9c0d3f-ghi789      2/2     Running   0
# reviews-v2-9f6g0d1e4f-jkl012      2/2     Running   0
# reviews-v3-0g7h1e2f5g-mno345      2/2     Running   0
# ratings-v1-1h8i2f3g6h-pqr678      2/2     Running   0
```

### **Deploy E-commerce Application**
```yaml
# ecommerce-frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ecommerce-frontend
  labels:
    app: ecommerce-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ecommerce-frontend
  template:
    metadata:
      labels:
        app: ecommerce-frontend
    spec:
      containers:
      - name: ecommerce-frontend
        image: ecommerce-frontend:latest
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: ecommerce-frontend
spec:
  selector:
    app: ecommerce-frontend
  ports:
  - port: 80
    targetPort: 3000
```

```bash
# Deploy e-commerce application
kubectl apply -f ecommerce-frontend.yaml

# Verify deployment
kubectl get pods -l app=ecommerce-frontend
# NAME                                READY   STATUS    RESTARTS
# ecommerce-frontend-abc123-xyz789    2/2     Running   0
# ecommerce-frontend-def456-uvw012    2/2     Running   0
# ecommerce-frontend-ghi789-rst345    2/2     Running   0
```

## 🛠️ **Step 5: Configure Istio Gateway**

### **Create Gateway**
```yaml
# ecommerce-gateway.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ecommerce-gateway
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - ecommerce.example.com
```

### **Create VirtualService**
```yaml
# ecommerce-virtualservice.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ecommerce-frontend
spec:
  hosts:
  - ecommerce.example.com
  gateways:
  - ecommerce-gateway
  http:
  - route:
    - destination:
        host: ecommerce-frontend
        port:
          number: 80
```

```bash
# Apply gateway configuration
kubectl apply -f ecommerce-gateway.yaml
kubectl apply -f ecommerce-virtualservice.yaml

# Verify gateway
kubectl get gateway
# NAME               AGE
# ecommerce-gateway  1m

# Verify virtual service
kubectl get virtualservice
# NAME                AGE
# ecommerce-frontend  1m
```

## 🛠️ **Step 6: Verify Installation**

### **Check Istio Components**
```bash
# Check control plane
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# istiod-7c4d4b8c5d-abc123                1/1     Running   0
# istio-ingressgateway-7d4f8b9c2e-def456  1/1     Running   0

# Check sidecar injection
kubectl get pods -l app=ecommerce-frontend
# NAME                                READY   STATUS    RESTARTS
# ecommerce-frontend-abc123-xyz789    2/2     Running   0
```

### **Test Service Communication**
```bash
# Test internal service communication
kubectl exec -it ecommerce-frontend-abc123-xyz789 -c ecommerce-frontend -- curl http://ecommerce-backend:3000/health

# Test external access
kubectl port-forward svc/istio-ingressgateway 8080:80 -n istio-system
curl http://localhost:8080
```

### **Check Istio Configuration**
```bash
# Check Istio configuration
istioctl analyze

# Check proxy configuration
istioctl proxy-config cluster ecommerce-frontend-abc123-xyz789

# Check proxy status
istioctl proxy-status
# NAME                                CDS        LDS        EDS        RDS        ISTIOD     VERSION
# ecommerce-frontend-abc123-xyz789    SYNCED     SYNCED     SYNCED     SYNCED     istiod-1   1.19.0
```

## 🛠️ **Step 7: Configure Observability**

### **Install Prometheus**
```bash
# Install Prometheus
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/prometheus.yaml

# Verify Prometheus
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# prometheus-7c4d4b8c5d-abc123            1/1     Running   0
```

### **Install Grafana**
```bash
# Install Grafana
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/grafana.yaml

# Verify Grafana
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# grafana-7d4f8b9c2e-def456               1/1     Running   0
```

### **Install Jaeger**
```bash
# Install Jaeger
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/jaeger.yaml

# Verify Jaeger
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# jaeger-8e5f9c0d3f-ghi789                1/1     Running   0
```

## 🛠️ **Step 8: Configure Security**

### **Enable mTLS**
```yaml
# mtls-policy.yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: default
spec:
  mtls:
    mode: STRICT
```

```bash
# Apply mTLS policy
kubectl apply -f mtls-policy.yaml

# Verify mTLS
kubectl get peerauthentication
# NAME      AGE
# default   1m
```

### **Configure Authorization**
```yaml
# authorization-policy.yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: ecommerce-frontend
spec:
  selector:
    matchLabels:
      app: ecommerce-frontend
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/default/sa/ecommerce-frontend"]
    to:
    - operation:
        methods: ["GET", "POST"]
```

```bash
# Apply authorization policy
kubectl apply -f authorization-policy.yaml

# Verify authorization policy
kubectl get authorizationpolicy
# NAME                AGE
# ecommerce-frontend  1m
```

## 🎯 **Learning: Installation Best Practices**

### **1. 🚀 Production Installation**
```bash
# Use production profile
istioctl install --set profile=production

# Configure resource limits
istioctl install \
  --set values.pilot.resources.requests.memory=2Gi \
  --set values.pilot.resources.requests.cpu=1000m \
  --set values.global.proxy.resources.requests.memory=256Mi \
  --set values.global.proxy.resources.requests.cpu=200m
```

### **2. 🔒 Security Configuration**
```bash
# Enable mTLS by default
kubectl apply -f - <<EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
EOF
```

### **3. 📊 Observability Setup**
```bash
# Install all observability components
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/kiali.yaml
```

## 🎯 **Troubleshooting Installation**

### **Common Issues**

#### **1. Pod Not Ready**
```bash
# Check pod status
kubectl get pods -n istio-system
# NAME                                    READY   STATUS    RESTARTS
# istiod-7c4d4b8c5d-abc123                0/1     Pending   0

# Check pod events
kubectl describe pod istiod-7c4d4b8c5d-abc123 -n istio-system
# Events:
#   Warning  FailedScheduling  pod/istiod-7c4d4b8c5d-abc123  insufficient cpu
```

#### **2. Sidecar Injection Issues**
```bash
# Check sidecar injection
kubectl get pods -l app=ecommerce-frontend
# NAME                                READY   STATUS    RESTARTS
# ecommerce-frontend-abc123-xyz789    1/2     Running   0

# Check sidecar logs
kubectl logs ecommerce-frontend-abc123-xyz789 -c istio-proxy
```

#### **3. Configuration Issues**
```bash
# Check Istio configuration
istioctl analyze

# Check proxy configuration
istioctl proxy-config cluster ecommerce-frontend-abc123-xyz789
```

## 🎯 **Interview Questions You Can Now Answer**

1. **"How do you install Istio in a Kubernetes cluster?"**
2. **"What are the steps to enable sidecar injection?"**
3. **"How do you configure Istio gateway and virtual services?"**
4. **"What observability components does Istio provide?"**
5. **"How do you troubleshoot Istio installation issues?"**

## 🎯 **Key Takeaways**

### **Essential Steps**
1. **Download and install Istio control plane**
2. **Enable sidecar injection for namespaces**
3. **Deploy applications with sidecar proxies**
4. **Configure gateway and virtual services**
5. **Set up observability and security**

### **Best Practices**
1. **Use production profile for production deployments**
2. **Enable mTLS by default for security**
3. **Install observability components for monitoring**
4. **Test installation thoroughly before production use**
5. **Monitor resource usage and performance**

---

**Next:** [Traffic Management](./04-traffic-management.md)
