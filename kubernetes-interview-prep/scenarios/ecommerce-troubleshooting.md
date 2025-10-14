# 🚨 **Scenario: E-commerce Application Troubleshooting**

## 📋 **Problem Description**

### **Business Impact**
- **Severity**: Critical
- **Affected Users**: 15,000+ customers
- **Revenue Impact**: $75,000/hour
- **Timeline**: 3:00 AM - Black Friday traffic spike expected at 6:00 AM

### **Initial Symptoms**
- E-commerce application pods are experiencing high memory usage
- Some pods are being OOMKilled
- Response times have increased from 200ms to 5+ seconds
- Users reporting "Service Unavailable" errors
- HPA is constantly scaling up but pods keep failing

### **Affected Systems**
- Frontend application pods
- Database connections
- Redis cache
- Load balancer health checks

## 🔍 **Investigation Process**

### **Step 1: Assess the Situation (30 seconds)**
```bash
# Check overall cluster status
kubectl get pods -n ecommerce-production
kubectl get hpa -n ecommerce-production
kubectl get events -n ecommerce-production --sort-by=.metadata.creationTimestamp

# Expected output showing issues
NAME                              READY   STATUS      RESTARTS   AGE
ecommerce-frontend-abc123         1/1     Running     0          5m
ecommerce-frontend-def456         0/1     OOMKilled   3          4m
ecommerce-frontend-ghi789         0/1     CrashLoopBackOff 2   3m
postgres-0                        1/1     Running     0          10m
redis-xyz789                      1/1     Running     0          10m
```

### **Step 2: Deep Dive Analysis (2 minutes)**
```bash
# Check resource usage
kubectl top pods -n ecommerce-production
kubectl describe pod ecommerce-frontend-def456 -n ecommerce-production

# Check HPA status
kubectl describe hpa ecommerce-frontend-hpa -n ecommerce-production

# Check application logs
kubectl logs ecommerce-frontend-def456 -n ecommerce-production --previous
kubectl logs ecommerce-frontend-ghi789 -n ecommerce-production --previous
```

### **Step 3: Root Cause Analysis (1 minute)**
```bash
# Check memory limits vs usage
kubectl get pods -n ecommerce-production -o jsonpath='{.items[*].spec.containers[*].resources}'

# Check node resources
kubectl describe nodes | grep -A 10 "Allocated resources"

# Check if it's a memory leak or configuration issue
kubectl logs -f deployment/ecommerce-frontend -n ecommerce-production | grep -i "memory\|heap\|oom"
```

## 🔍 **Root Cause Analysis**

### **Common Causes & Solutions**

#### **1. Memory Leak in Application (Most Likely)**
```bash
# Symptoms in logs:
# "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory"
# "Warning: Memory usage is growing continuously"

# Investigation:
kubectl logs ecommerce-frontend-def456 -n ecommerce-production --previous | grep -i "memory\|heap"

# Solution: Increase memory limits and investigate code
kubectl patch deployment ecommerce-frontend -n ecommerce-production -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

#### **2. Insufficient Memory Limits**
```bash
# Symptoms:
# Pods getting OOMKilled repeatedly
# HPA scaling up but pods failing

# Investigation:
kubectl describe pod ecommerce-frontend-def456 -n ecommerce-production | grep -A 5 -B 5 "Limits\|Requests"

# Solution: Increase memory limits
kubectl patch deployment ecommerce-frontend -n ecommerce-production -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"memory":"1Gi"},"limits":{"memory":"2Gi"}}}]}}}}'
```

#### **3. Database Connection Pool Exhaustion**
```bash
# Symptoms:
# "Error: connect ECONNREFUSED"
# "Too many connections"

# Investigation:
kubectl logs ecommerce-frontend-ghi789 -n ecommerce-production --previous | grep -i "connection\|database"

# Solution: Check database connections and connection pooling
kubectl exec -it postgres-0 -n ecommerce-production -- psql -U ecommerce -d ecommerce_db -c "SELECT count(*) FROM pg_stat_activity;"
```

#### **4. Redis Memory Issues**
```bash
# Symptoms:
# Redis connection failures
# Cache misses increasing

# Investigation:
kubectl logs redis-xyz789 -n ecommerce-production | grep -i "memory\|eviction"

# Solution: Check Redis memory usage
kubectl exec -it redis-xyz789 -n ecommerce-production -- redis-cli info memory
```

## 🛠️ **Solution Implementation**

### **Immediate Fix (3 minutes)**
```bash
# 1. Increase memory limits to handle current load
kubectl patch deployment ecommerce-frontend -n ecommerce-production -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"requests":{"memory":"1Gi","cpu":"500m"},"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# 2. Adjust HPA to prevent rapid scaling
kubectl patch hpa ecommerce-frontend-hpa -n ecommerce-production -p '{"spec":{"minReplicas":5,"maxReplicas":15,"behavior":{"scaleUp":{"stabilizationWindowSeconds":120}}}}'

# 3. Monitor the rollout
kubectl rollout status deployment/ecommerce-frontend -n ecommerce-production

# 4. Verify the fix
kubectl get pods -n ecommerce-production
kubectl top pods -n ecommerce-production
```

### **Verification (2 minutes)**
```bash
# Check pod status
kubectl get pods -n ecommerce-production -l app=ecommerce

# Check resource usage
kubectl top pods -n ecommerce-production

# Test application health
kubectl port-forward svc/ecommerce-frontend-service 8080:80 -n ecommerce-production &
curl -f http://localhost:8080/api/health

# Check HPA status
kubectl get hpa ecommerce-frontend-hpa -n ecommerce-production
kubectl describe hpa ecommerce-frontend-hpa -n ecommerce-production
```

## 📚 **Long-term Solutions**

### **Application Optimization**
```bash
# 1. Implement proper garbage collection
# Add to deployment environment variables:
env:
- name: NODE_OPTIONS
  value: "--max-old-space-size=1536 --gc-interval=100"

# 2. Optimize memory usage in code
# Review and fix memory leaks in the application
# Implement proper connection pooling
# Add memory monitoring and alerting
```

### **Infrastructure Improvements**
```bash
# 1. Set up proper monitoring
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ecommerce-pods
  namespace: ecommerce-production
spec:
  selector:
    matchLabels:
      app: ecommerce
  endpoints:
  - port: metrics
    path: /api/metrics
EOF

# 2. Implement proper alerting
kubectl apply -f - <<EOF
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ecommerce-alerts
  namespace: ecommerce-production
spec:
  groups:
  - name: ecommerce.rules
    rules:
    - alert: PodMemoryUsageHigh
      expr: (container_memory_usage_bytes{pod=~"ecommerce-frontend-.*"} / container_spec_memory_limit_bytes{pod=~"ecommerce-frontend-.*"}) > 0.8
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} memory usage is high"
    - alert: PodOOMKilled
      expr: increase(kube_pod_container_status_restarts_total{pod=~"ecommerce-frontend-.*"}[5m]) > 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} has been restarted"
EOF
```

### **Prevention Measures**
1. **Resource Planning**: Set appropriate memory requests and limits
2. **Monitoring**: Implement comprehensive monitoring and alerting
3. **Code Review**: Regular memory leak detection in code reviews
4. **Load Testing**: Regular performance testing under load
5. **Capacity Planning**: Monitor trends and plan for growth

## 🎯 **Interview Questions & Answers**

### **Q: "Your e-commerce application is experiencing memory issues. How do you troubleshoot this?"**
**A:** "I follow a systematic approach:
1. **Assess**: Check pod status, HPA behavior, and resource usage
2. **Investigate**: Analyze logs, describe failing pods, check resource limits
3. **Diagnose**: Identify if it's a memory leak, insufficient limits, or configuration issue
4. **Fix**: Apply immediate fixes (increase limits, adjust HPA) and long-term solutions
5. **Verify**: Monitor rollout, test health checks, confirm stability

Let me walk through a real example from our production environment..."

### **Q: "How do you prevent memory issues in production?"**
**A:** "Prevention is key. I implement:
1. **Proper resource management** - Set realistic requests and limits
2. **Monitoring and alerting** - Early warning systems for memory usage
3. **Code quality** - Regular memory leak detection and performance reviews
4. **Load testing** - Test under realistic production loads
5. **Capacity planning** - Monitor trends and plan for growth

The goal is to catch issues before they become critical production problems."

### **Q: "What's your approach to handling traffic spikes?"**
**A:** "For traffic spikes, I use a multi-layered approach:
1. **HPA configuration** - Proper scaling policies and stabilization windows
2. **Resource optimization** - Ensure pods can handle increased load
3. **Caching strategies** - Use Redis effectively to reduce database load
4. **Circuit breakers** - Implement fallback mechanisms
5. **Monitoring** - Real-time visibility into system performance

The key is being proactive rather than reactive."

---

**Next Scenario**: [Network Connectivity Issues](./network-connectivity.md)
