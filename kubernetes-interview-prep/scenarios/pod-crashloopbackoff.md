# 🚨 **Scenario: Pod CrashLoopBackOff**

## 📋 **Problem Description**

### **Business Impact**
- **Severity**: Critical
- **Affected Users**: 10,000+ customers
- **Revenue Impact**: $50,000/hour
- **Timeline**: 2:30 AM - Peak traffic expected at 6:00 AM

### **Initial Symptoms**
- E-commerce application pods are in `CrashLoopBackOff` state
- Users cannot access the website
- Payment processing is down
- Customer support is flooded with complaints

### **Affected Systems**
- Frontend application pods
- Payment service pods
- User authentication pods
- Product catalog pods

## 🔍 **Investigation Process**

### **Step 1: Assess the Situation (30 seconds)**
```bash
# Check overall cluster status
kubectl get pods -o wide
kubectl get nodes
kubectl get events --sort-by=.metadata.creationTimestamp

# Expected output showing CrashLoopBackOff
NAME                              READY   STATUS             RESTARTS   AGE
ecommerce-frontend-abc123         0/1     CrashLoopBackOff   5          10m
ecommerce-payment-def456          0/1     CrashLoopBackOff   3          8m
ecommerce-auth-ghi789             0/1     CrashLoopBackOff   4          12m
```

### **Step 2: Deep Dive into Failing Pods (2 minutes)**
```bash
# Get detailed information about the failing pod
kubectl describe pod ecommerce-frontend-abc123

# Check logs from the previous container (before crash)
kubectl logs ecommerce-frontend-abc123 --previous

# Check current logs
kubectl logs ecommerce-frontend-abc123

# Check resource usage
kubectl top pods
kubectl describe nodes
```

### **Step 3: Analyze the Root Cause (1 minute)**
```bash
# Check if it's a configuration issue
kubectl get configmap
kubectl get secret

# Check if it's a resource constraint
kubectl describe pod ecommerce-frontend-abc123 | grep -A 10 -B 5 "Limits\|Requests"

# Check if it's an image issue
kubectl describe pod ecommerce-frontend-abc123 | grep -A 5 -B 5 "Image"
```

## 🔍 **Root Cause Analysis**

### **Common Causes & Solutions**

#### **1. Memory Issues (Most Common)**
```bash
# Symptoms in logs:
# "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory"

# Investigation:
kubectl describe pod ecommerce-frontend-abc123 | grep -A 5 -B 5 "memory"
kubectl top pods

# Solution: Increase memory limits
kubectl patch deployment ecommerce-frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"1Gi"}}}]}}}}'
```

#### **2. Configuration Issues**
```bash
# Symptoms in logs:
# "Error: Cannot connect to database"
# "Error: Missing environment variable DATABASE_URL"

# Investigation:
kubectl get configmap ecommerce-config -o yaml
kubectl get secret ecommerce-secrets -o yaml

# Solution: Fix configuration
kubectl patch configmap ecommerce-config --patch '{"data":{"DATABASE_URL":"postgresql://correct-url"}}'
kubectl rollout restart deployment ecommerce-frontend
```

#### **3. Image Issues**
```bash
# Symptoms in logs:
# "Error: ImagePullBackOff"
# "Error: Failed to pull image"

# Investigation:
kubectl describe pod ecommerce-frontend-abc123 | grep -A 10 -B 5 "Events"

# Solution: Fix image reference
kubectl patch deployment ecommerce-frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","image":"ecommerce-client:v1.2.3"}]}}}}'
```

#### **4. Health Check Issues**
```bash
# Symptoms in logs:
# "Readiness probe failed"
# "Liveness probe failed"

# Investigation:
kubectl describe pod ecommerce-frontend-abc123 | grep -A 10 -B 5 "Readiness\|Liveness"

# Solution: Fix health check configuration
kubectl patch deployment ecommerce-frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","readinessProbe":{"httpGet":{"path":"/api/health","port":3000},"initialDelaySeconds":30}}]}}}}'
```

## 🛠️ **Solution Implementation**

### **Immediate Fix (2 minutes)**
```bash
# 1. Identify the specific issue from logs
kubectl logs ecommerce-frontend-abc123 --previous | tail -20

# 2. Apply the appropriate fix based on root cause
# Example: Memory issue
kubectl patch deployment ecommerce-frontend -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"1Gi","cpu":"500m"},"requests":{"memory":"512Mi","cpu":"250m"}}}]}}}}'

# 3. Monitor the rollout
kubectl rollout status deployment ecommerce-frontend

# 4. Verify the fix
kubectl get pods
kubectl logs -f deployment/ecommerce-frontend
```

### **Verification (1 minute)**
```bash
# Check pod status
kubectl get pods -l app=ecommerce-frontend

# Check application health
kubectl exec -it $(kubectl get pods -l app=ecommerce-frontend -o jsonpath='{.items[0].metadata.name}') -- curl localhost:3000/api/health

# Check resource usage
kubectl top pods -l app=ecommerce-frontend

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp | tail -10
```

## 📚 **Lessons Learned**

### **Process Improvements**
1. **Proactive Monitoring**: Set up alerts for pod restarts
2. **Resource Planning**: Implement proper resource requests and limits
3. **Health Checks**: Ensure readiness and liveness probes are properly configured
4. **Image Management**: Use specific image tags, not `latest`

### **Tool Recommendations**
```bash
# Monitoring setup
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: ecommerce-pods
spec:
  selector:
    matchLabels:
      app: ecommerce
  endpoints:
  - port: metrics
    path: /metrics
EOF

# Alerting rules
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ecommerce-alerts
spec:
  groups:
  - name: ecommerce.rules
    rules:
    - alert: PodCrashLoopBackOff
      expr: kube_pod_status_phase{phase="Running"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is in CrashLoopBackOff"
EOF
```

### **Prevention Measures**
1. **Resource Limits**: Always set appropriate resource limits
2. **Health Checks**: Implement proper readiness and liveness probes
3. **Configuration Management**: Use ConfigMaps and Secrets properly
4. **Image Security**: Scan images for vulnerabilities
5. **Monitoring**: Set up comprehensive monitoring and alerting

## 🎯 **Interview Questions & Answers**

### **Q: "How do you troubleshoot a pod in CrashLoopBackOff?"**
**A:** "I follow a systematic approach:
1. **Assess**: Check overall cluster status and identify affected pods
2. **Investigate**: Get detailed pod information and check logs
3. **Analyze**: Identify the root cause (memory, config, image, health checks)
4. **Fix**: Apply the appropriate solution based on the root cause
5. **Verify**: Monitor the rollout and confirm the fix works

Let me walk through a real example from our production environment..."

### **Q: "What are the most common causes of CrashLoopBackOff?"**
**A:** "In my experience, the most common causes are:
1. **Memory issues** (70% of cases) - OOMKilled due to insufficient memory limits
2. **Configuration issues** (15% of cases) - Missing or incorrect environment variables
3. **Image issues** (10% of cases) - Failed image pulls or corrupted images
4. **Health check issues** (5% of cases) - Incorrectly configured probes

I always start by checking the logs and resource usage, as these give the fastest indication of the root cause."

### **Q: "How do you prevent CrashLoopBackOff in production?"**
**A:** "Prevention is key. I implement:
1. **Proper resource management** - Set appropriate requests and limits
2. **Health check configuration** - Ensure readiness and liveness probes work
3. **Configuration validation** - Use ConfigMaps and Secrets properly
4. **Monitoring and alerting** - Set up alerts for pod restarts
5. **Image management** - Use specific tags and scan for vulnerabilities

The goal is to catch issues before they become critical production problems."

---

**Next Scenario**: [Memory Leak Investigation](./memory-leak.md)
