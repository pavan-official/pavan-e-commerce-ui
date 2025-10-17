# 🛠️ **Rollback Practice Exercise**

## 🎯 **Learning: Hands-On Rollback Practice**

### **Exercise: Simulate a Rollback Scenario**

Let's practice rollbacks with a **real example** you can run locally.

---

## 🚀 **Setup: Create a Test Deployment**

### **Step 1: Create a Test Deployment**
```bash
# Create a simple deployment
kubectl create deployment test-app --image=nginx:1.18

# Check deployment status
kubectl get deployments
kubectl get pods
```

### **Step 2: Create a Service**
```bash
# Create a service to access the app
kubectl expose deployment test-app --port=80 --type=NodePort

# Get the service URL
kubectl get services
```

### **Step 3: Test the Application**
```bash
# Test the application
curl http://localhost:$(kubectl get service test-app -o jsonpath='{.spec.ports[0].nodePort}')
# Should return: nginx welcome page
```

---

## 🎬 **Simulate a Problematic Deployment**

### **Step 4: Deploy a "Bad" Version**
```bash
# Deploy a version that will cause issues
kubectl set image deployment/test-app nginx=nginx:1.19

# Check deployment history
kubectl rollout history deployment/test-app
# Output:
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         kubectl set image deployment/test-app nginx=nginx:1.19
```

### **Step 5: Deploy Another Version**
```bash
# Deploy another version
kubectl set image deployment/test-app nginx=nginx:1.20

# Check deployment history
kubectl rollout history deployment/test-app
# Output:
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         kubectl set image deployment/test-app nginx=nginx:1.19
# 3         kubectl set image deployment/test-app nginx=nginx:1.20
```

---

## 🔄 **Practice Rollback Scenarios**

### **Scenario 1: Rollback to Previous Version**
```bash
# Rollback to the previous version (nginx:1.19)
kubectl rollout undo deployment/test-app

# Check the rollback
kubectl rollout status deployment/test-app

# Verify the image
kubectl describe deployment test-app | grep Image
# Should show: nginx:1.19
```

### **Scenario 2: Rollback to Specific Revision**
```bash
# Rollback to revision 1 (nginx:1.18)
kubectl rollout undo deployment/test-app --to-revision=1

# Check the rollback
kubectl rollout status deployment/test-app

# Verify the image
kubectl describe deployment test-app | grep Image
# Should show: nginx:1.18
```

### **Scenario 3: Rollback with Watch**
```bash
# Rollback and watch the progress
kubectl rollout undo deployment/test-app --watch

# You'll see the rollback progress in real-time
```

---

## 🎯 **Learning: Advanced Rollback Scenarios**

### **Scenario 4: Simulate a Failing Deployment**
```bash
# Deploy an image that doesn't exist (will fail)
kubectl set image deployment/test-app nginx=nginx:999.999.999

# Watch the deployment fail
kubectl rollout status deployment/test-app --timeout=60s

# Check pod status
kubectl get pods
# You'll see pods in ImagePullBackOff or ErrImagePull status

# Rollback to fix the issue
kubectl rollout undo deployment/test-app

# Verify rollback success
kubectl get pods
# Pods should be running again
```

### **Scenario 5: Rollback with Resource Constraints**
```bash
# Deploy with resource limits that might cause issues
kubectl patch deployment test-app -p '{"spec":{"template":{"spec":{"containers":[{"name":"nginx","resources":{"limits":{"memory":"1Mi"}}}]}}}}'

# Check if pods are having issues
kubectl get pods

# Rollback to remove resource constraints
kubectl rollout undo deployment/test-app

# Verify rollback success
kubectl get pods
```

---

## 🎯 **Learning: Rollback Monitoring**

### **Monitor Rollback Progress**
```bash
# Watch rollback in real-time
kubectl rollout undo deployment/test-app --watch

# Check deployment events
kubectl get events --sort-by=.metadata.creationTimestamp

# Monitor pod changes
kubectl get pods -w

# Check service endpoints
kubectl get endpoints test-app -w
```

### **Verify Rollback Success**
```bash
# Check deployment status
kubectl rollout status deployment/test-app

# Verify pod health
kubectl get pods

# Check application functionality
curl http://localhost:$(kubectl get service test-app -o jsonpath='{.spec.ports[0].nodePort}')

# Check deployment history
kubectl rollout history deployment/test-app
```

---

## 🎯 **Learning: Rollback Best Practices**

### **1. Always Test Rollbacks**
```bash
# Test rollback procedures regularly
kubectl rollout undo deployment/test-app --dry-run=client

# Verify rollback will work
kubectl rollout history deployment/test-app
```

### **2. Monitor Rollback Progress**
```bash
# Always monitor rollback progress
kubectl rollout status deployment/test-app --timeout=300s

# Watch for any issues
kubectl get pods -w
```

### **3. Document Rollback Reasons**
```bash
# Add change-cause to deployments
kubectl annotate deployment/test-app kubernetes.io/change-cause="Rollback due to performance issues"

# Check deployment history with reasons
kubectl rollout history deployment/test-app
```

### **4. Verify Rollback Success**
```bash
# Always verify rollback success
kubectl get pods
kubectl get services
kubectl get endpoints

# Test application functionality
curl http://localhost:$(kubectl get service test-app -o jsonpath='{.spec.ports[0].nodePort}')
```

---

## 🎯 **Learning: Common Rollback Mistakes**

### **Mistake 1: Not Monitoring Rollback Progress**
```bash
# ❌ Wrong: Start rollback and walk away
kubectl rollout undo deployment/test-app

# ✅ Correct: Monitor rollback progress
kubectl rollout undo deployment/test-app --watch
kubectl rollout status deployment/test-app
```

### **Mistake 2: Not Verifying Rollback Success**
```bash
# ❌ Wrong: Assume rollback worked
kubectl rollout undo deployment/test-app

# ✅ Correct: Verify rollback success
kubectl rollout undo deployment/test-app
kubectl get pods
kubectl get services
curl http://localhost:$(kubectl get service test-app -o jsonpath='{.spec.ports[0].nodePort}')
```

### **Mistake 3: Not Documenting Rollback Reasons**
```bash
# ❌ Wrong: No documentation
kubectl rollout undo deployment/test-app

# ✅ Correct: Document rollback reason
kubectl annotate deployment/test-app kubernetes.io/change-cause="Rollback due to high error rate"
kubectl rollout undo deployment/test-app
```

---

## 🎯 **Learning: Rollback Troubleshooting**

### **Common Rollback Issues:**

1. **Rollback Stuck**
   ```bash
   # Check deployment status
   kubectl rollout status deployment/test-app
   
   # Check pod status
   kubectl get pods
   
   # Check events
   kubectl get events --sort-by=.metadata.creationTimestamp
   ```

2. **Rollback Fails**
   ```bash
   # Check deployment details
   kubectl describe deployment test-app
   
   # Check pod logs
   kubectl logs deployment/test-app
   
   # Check resource constraints
   kubectl top pods
   ```

3. **Rollback Takes Too Long**
   ```bash
   # Check resource availability
   kubectl get nodes
   kubectl describe nodes
   
   # Check image pull issues
   kubectl get pods
   kubectl describe pod <pod-name>
   ```

---

## 🎯 **Learning: Cleanup**

### **Clean Up Test Resources**
```bash
# Delete the test deployment
kubectl delete deployment test-app

# Delete the test service
kubectl delete service test-app

# Verify cleanup
kubectl get deployments
kubectl get services
kubectl get pods
```

---

## 🎯 **Interview Questions You Can Now Answer:**

1. **"How do you practice rollback procedures?"**
2. **"What do you monitor during a rollback?"**
3. **"How do you verify rollback success?"**
4. **"What are common rollback mistakes?"**
5. **"How do you troubleshoot rollback issues?"**
6. **"How do you test rollback procedures?"**
7. **"What's your rollback checklist?"**
8. **"How do you document rollback reasons?"**
