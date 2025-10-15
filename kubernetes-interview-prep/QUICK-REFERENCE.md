# 🚀 **Kubernetes E-commerce Quick Reference**

## 📋 **Essential Commands**

### **Deployment Commands**
```bash
# Deploy everything
kubectl apply -f kubernetes-interview-prep/manifests/

# Check status
kubectl get pods -n ecommerce-production
kubectl get services -n ecommerce-production
kubectl get ingress -n ecommerce-production

# Access application
kubectl port-forward svc/ecommerce-frontend-service 8080:80 -n ecommerce-production
```

### **Debugging Commands**
```bash
# Check pod logs
kubectl logs -l app=ecommerce -n ecommerce-production

# Describe resources
kubectl describe pod <pod-name> -n ecommerce-production
kubectl describe service ecommerce-frontend-service -n ecommerce-production

# Test RBAC
kubectl auth can-i get pods --as=system:serviceaccount:ecommerce-production:ecommerce-frontend -n ecommerce-production
```

### **Scaling Commands**
```bash
# Manual scaling
kubectl scale deployment ecommerce-frontend --replicas=3 -n ecommerce-production

# Check HPA
kubectl get hpa -n ecommerce-production

# Check resource usage
kubectl top pods -n ecommerce-production
```

## 🎯 **Key Interview Points**

### **Architecture**
- **Multi-tier**: Frontend → Services → Database/Cache
- **High Availability**: Multiple replicas, rolling updates
- **Security**: RBAC, network policies, SSL/TLS
- **Monitoring**: Health checks, metrics, logging

### **Key Components**
- **Deployments**: Application pods with rolling updates
- **StatefulSets**: Database with persistent storage
- **Services**: Load balancing and service discovery
- **Ingress**: External access with SSL termination
- **HPA**: Automatic scaling based on metrics
- **PDB**: High availability during maintenance

### **Security Features**
- **RBAC**: Least privilege access control
- **Non-root containers**: Security best practice
- **Network policies**: Traffic isolation
- **Secrets management**: Secure credential storage

## 🔧 **Troubleshooting Checklist**

### **Pod Issues**
- [ ] Check pod status: `kubectl get pods`
- [ ] Check events: `kubectl describe pod <pod-name>`
- [ ] Check logs: `kubectl logs <pod-name>`
- [ ] Check resources: `kubectl top pods`

### **Service Issues**
- [ ] Check service endpoints: `kubectl get endpoints`
- [ ] Check pod labels: `kubectl get pods --show-labels`
- [ ] Test connectivity: `kubectl exec -it <pod-name> -- curl <service-name>`

### **Ingress Issues**
- [ ] Check ingress controller: `kubectl get pods -n ingress-nginx`
- [ ] Check ingress status: `kubectl describe ingress <ingress-name>`
- [ ] Check service: `kubectl get service <service-name>`

## 📊 **Performance Metrics**

### **Key Metrics to Monitor**
- **CPU Usage**: Target < 70% for HPA
- **Memory Usage**: Target < 80% for HPA
- **Response Time**: Target < 2 seconds
- **Error Rate**: Target < 1%
- **Pod Availability**: Target > 99.9%

### **Scaling Triggers**
- **CPU**: > 70% average utilization
- **Memory**: > 80% average utilization
- **Custom**: Application-specific metrics

## 🎯 **Interview Success Tips**

### **Be Specific**
- Use exact resource names and configurations
- Mention specific metrics and thresholds
- Provide concrete examples from our implementation

### **Show Understanding**
- Explain the "why" behind each decision
- Connect components to real-world benefits
- Demonstrate troubleshooting experience

### **Production Focus**
- Emphasize security and reliability
- Discuss monitoring and observability
- Show understanding of operational concerns

---

**Remember**: This is your cheat sheet for Kubernetes interviews! 🚀
