# 🚀 **Kubernetes Interview Quick Reference**

## 🔄 **Rollback Commands - Quick Reference**

### **Essential Rollback Commands**
```bash
# Basic rollback to previous version
kubectl rollout undo deployment/app-name

# Rollback to specific revision
kubectl rollout undo deployment/app-name --to-revision=2

# Check rollback status
kubectl rollout status deployment/app-name

# View deployment history
kubectl rollout history deployment/app-name

# See specific revision details
kubectl rollout history deployment/app-name --revision=2
```

### **Advanced Rollback Commands**
```bash
# Rollback with timeout
kubectl rollout undo deployment/app-name --timeout=60s

# Rollback and watch progress
kubectl rollout undo deployment/app-name --watch

# Rollback multiple deployments
kubectl rollout undo deployment/app1 deployment/app2

# Rollback with dry-run
kubectl rollout undo deployment/app-name --dry-run=client
```

### **Rollback Verification Commands**
```bash
# Check pod status
kubectl get pods

# Check service endpoints
kubectl get endpoints

# Check application logs
kubectl logs deployment/app-name

# Check deployment events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## 🎯 **Rollback Decision Matrix**

| **Severity** | **Rollback Type** | **Time Limit** | **Example** |
|--------------|-------------------|----------------|-------------|
| 🚨 Critical | Immediate | < 30s | Service down |
| 🔴 High | Quick | < 1m | High error rate |
| 🟡 Medium | Gradual | < 5m | Performance issues |
| 🟢 Low | Investigate | < 30m | Minor bugs |

## 🔄 **Rollback Workflow**

```
🚨 Issue Detected
    ↓
🔍 Assess Severity
    ↓
🎯 Choose Strategy
    ↓
🔄 Execute Rollback
    ↓
✅ Verify Success
    ↓
📝 Document Incident
```

## 🎯 **Common Rollback Scenarios**

### **Scenario 1: Service Down**
```bash
# Immediate rollback
kubectl rollout undo deployment/app-name
kubectl rollout status deployment/app-name --timeout=30s
```

### **Scenario 2: High Error Rate**
```bash
# Quick rollback
kubectl rollout undo deployment/app-name --watch
```

### **Scenario 3: Performance Issues**
```bash
# Gradual rollback
kubectl rollout undo deployment/app-name --timeout=300s
```

## 📊 **Rollback Monitoring**

### **Key Metrics to Monitor**
- Error rates
- Response times
- Pod health
- Service endpoints
- Business metrics

### **Health Check Commands**
```bash
# Check pod health
kubectl get pods -o wide

# Check service health
kubectl get services

# Check endpoint health
kubectl get endpoints

# Check deployment health
kubectl describe deployment app-name
```

## 🎯 **Interview Tips**

### **Key Points to Emphasize**
1. **Decision Framework** - Structured approach to rollback decisions
2. **Time Optimization** - Strategies to minimize rollback time
3. **Communication** - Stakeholder notification and incident management
4. **Testing** - Regular practice and validation of rollback procedures
5. **Automation** - Automated triggers with human oversight

### **Common Interview Questions**
- "Walk me through a rollback scenario you've handled"
- "How do you decide when to rollback vs when to fix forward?"
- "What's your rollback process for different severity levels?"
- "How do you minimize rollback time?"
- "What metrics do you monitor for rollback decisions?"

---

**Last Updated:** 2025-01-15  
**Quick Reference for:** Rollback Strategies