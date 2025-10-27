# 🎬 **Complete Rollback Workflow Example**

## 🎯 **Learning: Real-World Rollback Scenario**

### **Scenario: E-commerce Platform Deployment**

Let's walk through a **complete rollback scenario** step by step.

---

## 📅 **Timeline: Deployment to Rollback**

### **9:00 AM - Initial Deployment**
```bash
# Developer deploys new version
kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.2.0

# Check deployment status
kubectl rollout status deployment/ecommerce
# Output: deployment "ecommerce" successfully rolled out

# Verify pods are running
kubectl get pods
# NAME                     READY   STATUS    RESTARTS
# ecommerce-abc123-xyz     1/1     Running   0
# ecommerce-def456-uvw     1/1     Running   0
# ecommerce-ghi789-rst     1/1     Running   0
```

### **9:05 AM - Monitoring Detects Issues**
```bash
# Prometheus alert fires
# Alert: HighErrorRate
# Description: Error rate increased from 0.1% to 3.2%
# Severity: High

# Check application logs
kubectl logs deployment/ecommerce --tail=100
# Output:
# ERROR: Database connection failed
# ERROR: Payment service timeout
# ERROR: User authentication failed
```

### **9:07 AM - On-call Engineer Investigates**
```bash
# Check pod health
kubectl get pods
# NAME                     READY   STATUS    RESTARTS
# ecommerce-abc123-xyz     0/1     Running   3
# ecommerce-def456-uvw     1/1     Running   0
# ecommerce-ghi789-rst     0/1     Running   2

# Check service endpoints
kubectl get endpoints ecommerce-service
# NAME                ENDPOINTS
# ecommerce-service   10.244.1.5:3000,10.244.2.3:3000

# Check deployment history
kubectl rollout history deployment/ecommerce
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.1.0
# 3         kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.2.0
```

### **9:10 AM - Decision: Rollback Required**
```bash
# On-call engineer decides to rollback
# Reason: High error rate, multiple pod restarts
# Target: Previous stable version (v1.1.0)

# Execute rollback
kubectl rollout undo deployment/ecommerce --to-revision=2
# Output: deployment.apps/ecommerce rolled back

# Monitor rollback progress
kubectl rollout status deployment/ecommerce --watch
# Output:
# Waiting for deployment "ecommerce" rollout to finish: 1 of 3 updated replicas are available...
# Waiting for deployment "ecommerce" rollout to finish: 2 of 3 updated replicas are available...
# deployment "ecommerce" successfully rolled out
```

### **9:12 AM - Rollback Complete**
```bash
# Verify rollback success
kubectl get pods
# NAME                     READY   STATUS    RESTARTS
# ecommerce-xyz789-abc     1/1     Running   0
# ecommerce-uvw456-def     1/1     Running   0
# ecommerce-rst123-ghi     1/1     Running   0

# Check deployment history
kubectl rollout history deployment/ecommerce
# REVISION  CHANGE-CAUSE
# 1         Initial deployment
# 2         kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.1.0
# 3         kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.2.0
# 4         kubectl rollout undo deployment/ecommerce --to-revision=2

# Verify application health
kubectl logs deployment/ecommerce --tail=10
# Output:
# INFO: Application started successfully
# INFO: Database connection established
# INFO: Payment service connected
```

---

## 🎯 **Learning: What Happened Behind the Scenes**

### **Kubernetes Rollback Process:**

```
1. 🎯 **Identify Target Revision**
   - Kubernetes found revision 2 (v1.1.0)
   - Verified it was the previous stable version

2. 🔄 **Update Deployment**
   - Changed image from v1.2.0 to v1.1.0
   - Updated pod template with old configuration

3. 🚀 **Rolling Update Process**
   - Created new pods with v1.1.0 image
   - Gradually replaced problematic pods
   - Maintained service availability throughout

4. ✅ **Health Verification**
   - New pods passed health checks
   - Service endpoints updated
   - Application functionality restored

5. 📊 **Cleanup**
   - Old pods terminated
   - New pods running stable version
   - Service fully operational
```

---

## 🎯 **Learning: Different Rollback Scenarios**

### **Scenario 1: Automatic Rollback (System-Triggered)**
```yaml
# Kubernetes automatically rolls back if health checks fail
apiVersion: apps/v1
kind: Deployment
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: ecommerce
        image: ghcr.io/company/ecommerce:v1.2.0
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3  # Rollback after 3 failures
```

### **Scenario 2: Manual Rollback (Human-Triggered)**
```bash
# Developer notices issues and manually rolls back
kubectl rollout undo deployment/ecommerce

# Or rollback to specific version
kubectl rollout undo deployment/ecommerce --to-revision=2
```

### **Scenario 3: CI/CD Pipeline Rollback**
```yaml
# GitHub Actions automatically rolls back on test failure
- name: Deploy to Production
  run: |
    kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.2.0
    kubectl rollout status deployment/ecommerce --timeout=300s

- name: Run Health Checks
  run: |
    # Run health checks
    if [ $? -ne 0 ]; then
      echo "Health checks failed, rolling back..."
      kubectl rollout undo deployment/ecommerce
      exit 1
    fi
```

### **Scenario 4: Monitoring System Rollback**
```yaml
# Prometheus alert triggers rollback
groups:
- name: rollback.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.02
    for: 2m
    annotations:
      rollback: "true"
      reason: "Error rate exceeded 2%"
    labels:
      severity: high
```

---

## 🎯 **Learning: Rollback Decision Matrix**

### **When to Rollback:**

| **Issue Type** | **Severity** | **Rollback Decision** | **Time to Rollback** |
|----------------|--------------|----------------------|---------------------|
| Service Down | Critical | Immediate | < 30 seconds |
| High Error Rate | High | Immediate | < 1 minute |
| Performance Issues | Medium | Quick | < 5 minutes |
| Minor Bugs | Low | Investigate First | < 30 minutes |
| Security Issues | Critical | Immediate | < 30 seconds |

### **Rollback Triggers:**

1. **🚨 Health Check Failures**
   - Pods keep crashing
   - Health endpoints failing
   - Readiness probes failing

2. **📊 Performance Degradation**
   - Response time increase
   - Throughput decrease
   - Resource usage spike

3. **💼 Business Impact**
   - Revenue loss
   - User complaints
   - Conversion rate drop

4. **🔒 Security Issues**
   - Security vulnerabilities
   - Unauthorized access
   - Data breaches

---

## 🎯 **Learning: Rollback Commands Reference**

### **Essential Rollback Commands:**

```bash
# 1. Rollback to previous version
kubectl rollout undo deployment/ecommerce

# 2. Rollback to specific revision
kubectl rollout undo deployment/ecommerce --to-revision=2

# 3. Check rollback status
kubectl rollout status deployment/ecommerce

# 4. See deployment history
kubectl rollout history deployment/ecommerce

# 5. See specific revision details
kubectl rollout history deployment/ecommerce --revision=2

# 6. Rollback with timeout
kubectl rollout undo deployment/ecommerce --timeout=60s

# 7. Rollback and watch progress
kubectl rollout undo deployment/ecommerce --watch

# 8. Rollback multiple deployments
kubectl rollout undo deployment/ecommerce deployment/payment-service
```

### **Advanced Rollback Commands:**

```bash
# 1. Rollback with specific strategy
kubectl patch deployment/ecommerce -p '{"spec":{"strategy":{"type":"Recreate"}}}'

# 2. Rollback with resource limits
kubectl rollout undo deployment/ecommerce --dry-run=client

# 3. Rollback with specific image
kubectl set image deployment/ecommerce ecommerce=ghcr.io/company/ecommerce:v1.1.0

# 4. Rollback with environment variables
kubectl rollout undo deployment/ecommerce --env=production
```

---

## 🎯 **Learning: Post-Rollback Actions**

### **What to Do After a Rollback:**

1. **📊 Verify System Health**
   ```bash
   # Check pod status
   kubectl get pods
   
   # Check service endpoints
   kubectl get endpoints
   
   # Check application logs
   kubectl logs deployment/ecommerce
   ```

2. **📝 Document Incident**
   - Record rollback reason
   - Document timeline
   - Note impact and resolution

3. **🔍 Analyze Root Cause**
   - Investigate what went wrong
   - Identify contributing factors
   - Plan preventive measures

4. **🚀 Plan Next Steps**
   - Fix the issue in development
   - Improve testing processes
   - Update deployment procedures

5. **📢 Communicate**
   - Notify stakeholders
   - Update status pages
   - Share lessons learned

---

## 🎯 **Interview Questions You Can Now Answer:**

1. **"Walk me through a rollback scenario you've handled."**
2. **"How do you decide when to rollback?"**
3. **"What's your rollback process?"**
4. **"How do you minimize rollback time?"**
5. **"What metrics do you monitor for rollback decisions?"**
6. **"How do you test rollback procedures?"**
7. **"What happens after a rollback?"**
8. **"How do you prevent rollbacks?"**
