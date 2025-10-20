# 📚 **Deployment History - How Kubernetes Tracks Versions**

## 🎯 **Learning: Kubernetes Deployment Revisions**

### **What Happens When You Deploy:**

```bash
# 1. Initial deployment
kubectl apply -f deployment.yaml
# Kubernetes creates: Revision 1

# 2. Update the image
kubectl set image deployment/ecommerce ecommerce=nginx:1.20
# Kubernetes creates: Revision 2

# 3. Update again
kubectl set image deployment/ecommerce ecommerce=nginx:1.21
# Kubernetes creates: Revision 3
```

### **Kubernetes Keeps History:**
```
Revision 1: nginx:1.18 (Original)
Revision 2: nginx:1.20 (First update)
Revision 3: nginx:1.21 (Current - PROBLEMATIC!)
```

## 🔍 **How to See Deployment History**

```bash
# See all revisions
kubectl rollout history deployment/ecommerce

# Output:
# deployment.apps/ecommerce
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         kubectl set image deployment/ecommerce ecommerce=nginx:1.20
# 3         kubectl set image deployment/ecommerce ecommerce=nginx:1.21

# See details of a specific revision
kubectl rollout history deployment/ecommerce --revision=2
```

## 🎯 **Learning: What Triggers a Rollback?**

### **Common Rollback Triggers:**

1. **🚨 Health Check Failures**
   ```bash
   # If pods keep crashing
   kubectl get pods
   # NAME                     READY   STATUS    RESTARTS
   # ecommerce-abc123-xyz     0/1     CrashLoopBackOff   5
   ```

2. **📊 High Error Rates**
   ```bash
   # If error rate jumps from 0.1% to 5%
   # Monitoring system detects this automatically
   ```

3. **⏱️ Slow Response Times**
   ```bash
   # If response time increases from 200ms to 5 seconds
   # Users start complaining
   ```

4. **💼 Business Metrics Drop**
   ```bash
   # If conversion rate drops from 3% to 1%
   # Revenue is affected
   ```

## 🎯 **Learning: Who Can Trigger Rollbacks?**

### **Automatic Rollbacks (System-Triggered):**
- **Kubernetes Health Checks** (if pods keep failing)
- **Monitoring Systems** (Prometheus, Datadog, etc.)
- **CI/CD Pipelines** (if tests fail)

### **Manual Rollbacks (Human-Triggered):**
- **Developers** (when they see issues)
- **DevOps Engineers** (when monitoring alerts)
- **On-call Engineers** (during incidents)
- **Managers** (when business metrics drop)

## 🎯 **Learning: Where Rollbacks Are Called From**

### **1. 🖥️ Command Line (kubectl)**
```bash
# Rollback to previous version
kubectl rollout undo deployment/ecommerce

# Rollback to specific version
kubectl rollout undo deployment/ecommerce --to-revision=2
```

### **2. 🌐 Web UI (Kubernetes Dashboard)**
- Click on deployment
- Click "Rollback" button
- Select version to rollback to

### **3. 🤖 Automated Systems**
```yaml
# Prometheus alert rule
groups:
- name: rollback.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.02
    for: 2m
    annotations:
      rollback: "true"
      reason: "Error rate exceeded 2%"
```

### **4. 📱 Monitoring Tools**
- **Grafana** dashboards with rollback buttons
- **Datadog** with automated rollback policies
- **New Relic** with rollback triggers

### **5. 🔄 CI/CD Pipelines**
```yaml
# GitHub Actions workflow
- name: Rollback on Failure
  if: failure()
  run: |
    kubectl rollout undo deployment/ecommerce
    kubectl rollout status deployment/ecommerce
```

## 🎯 **Learning: Rollback Decision Process**

### **Step-by-Step Decision Tree:**

```
1. 🚨 Issue Detected
   ↓
2. 🔍 Assess Severity
   - Critical (Service Down) → Immediate Rollback
   - High (High Error Rate) → Quick Rollback
   - Medium (Performance Issues) → Gradual Rollback
   - Low (Minor Issues) → Investigate First
   ↓
3. 🎯 Choose Rollback Strategy
   - Immediate: Switch traffic instantly
   - Gradual: Reduce traffic to new version
   - Scheduled: Plan rollback during maintenance
   ↓
4. 🔄 Execute Rollback
   - Run rollback command
   - Monitor rollback progress
   - Verify system health
   ↓
5. 📊 Post-Rollback Actions
   - Document incident
   - Analyze root cause
   - Improve processes
```

## 🎯 **Learning: Real-World Rollback Scenarios**

### **Scenario 1: E-commerce Payment Issue**
```
🚨 Problem: Payment processing fails for 20% of users
📊 Impact: Revenue loss, customer complaints
⏱️ Detection: 2 minutes after deployment
🎯 Decision: Immediate rollback
🔄 Action: kubectl rollout undo deployment/payment-service
✅ Result: Payment processing restored in 30 seconds
```

### **Scenario 2: API Performance Degradation**
```
🚨 Problem: API response time increased from 200ms to 2 seconds
📊 Impact: User experience degraded, but service still working
⏱️ Detection: 5 minutes after deployment
🎯 Decision: Gradual rollback
🔄 Action: Reduce traffic to new version from 100% to 0%
✅ Result: Performance restored over 10 minutes
```

### **Scenario 3: Database Connection Issues**
```
🚨 Problem: Database connections failing intermittently
📊 Impact: Some users can't access data
⏱️ Detection: 1 minute after deployment
🎯 Decision: Immediate rollback
🔄 Action: kubectl rollout undo deployment/api-service
✅ Result: Database connectivity restored in 45 seconds
```

## 🎯 **Learning: Rollback Commands You Need to Know**

### **Basic Rollback Commands:**
```bash
# Rollback to previous version
kubectl rollout undo deployment/ecommerce

# Rollback to specific revision
kubectl rollout undo deployment/ecommerce --to-revision=2

# Check rollback status
kubectl rollout status deployment/ecommerce

# See rollback history
kubectl rollout history deployment/ecommerce
```

### **Advanced Rollback Commands:**
```bash
# Rollback with specific timeout
kubectl rollout undo deployment/ecommerce --timeout=60s

# Rollback and watch progress
kubectl rollout undo deployment/ecommerce --watch

# Rollback multiple deployments
kubectl rollout undo deployment/ecommerce deployment/payment-service
```

## 🎯 **Learning: What Happens During a Rollback**

### **Kubernetes Rollback Process:**

```
1. 🎯 Identify Target Revision
   - Find the previous working version
   - Verify it's stable and tested

2. 🔄 Update Deployment
   - Change image to previous version
   - Update pod template

3. 🚀 Start Rolling Update
   - Create new pods with old image
   - Gradually replace problematic pods
   - Maintain service availability

4. ✅ Verify Rollback
   - Check pod health
   - Verify service endpoints
   - Monitor application metrics

5. 📊 Complete Rollback
   - All pods running old version
   - Service fully restored
   - Incident resolved
```

## 🎯 **Learning: Rollback Best Practices**

### **1. 🚨 Always Have a Rollback Plan**
- Document rollback procedures
- Test rollback scenarios regularly
- Have rollback scripts ready
- Train team on rollback procedures

### **2. 📊 Monitor Key Metrics**
- Error rates
- Response times
- Business metrics
- User satisfaction

### **3. ⏱️ Set Rollback Timeouts**
- Define maximum rollback time
- Set escalation procedures
- Have backup rollback methods

### **4. 📝 Document Everything**
- Record rollback reasons
- Analyze root causes
- Improve deployment processes
- Share lessons learned

## 🎯 **Interview Questions You Can Now Answer:**

1. **"How do you handle rollbacks in production?"**
2. **"What triggers an automatic rollback?"**
3. **"How do you minimize rollback time?"**
4. **"What metrics do you monitor for rollback decisions?"**
5. **"How do you test rollback procedures?"**
6. **"Who can trigger rollbacks in your organization?"**
7. **"What's your rollback decision process?"**
