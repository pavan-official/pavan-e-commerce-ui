# 🐕 DataDog Setup Instructions

## Quick Setup Guide

### Step 1: Add DataDog API Key to GitHub Secrets

1. **Go to your GitHub repository:**
   ```
   https://github.com/pavan-official/pavan-e-commerce-ui
   ```

2. **Navigate to Settings → Secrets and variables → Actions**

3. **Click "New repository secret"**

4. **Create the secret:**
   - **Name:** `DATADOG_API_KEY`
   - **Value:** `70f5b7b9c5c5f198b76c8823c9a7b38d`

5. **Click "Add secret"**

### Step 2: Trigger a New Deployment

Once the secret is added, the next CI/CD run will automatically deploy DataDog!

**Option A: Trigger manually**
```bash
# Make a small change to trigger the pipeline
cd "/Users/pavan/Pictures/MY-lesnpic-full-edited folders/LOCAL-documents/e-commerce-ui"
git commit --allow-empty -m "🐕 Trigger: Enable DataDog monitoring with API key"
git push origin main
```

**Option B: Wait for next commit**
The next time you push any changes, DataDog will be automatically deployed.

---

## What Gets Deployed

Once the DataDog API key is configured, the CI/CD pipeline will deploy:

### 🐕 DataDog Components

1. **DataDog Operator**
   - Manages DataDog agents in Kubernetes
   - Automatic updates and configuration management

2. **DataDog Agent (DaemonSet)**
   - Runs on every node
   - Collects metrics, logs, and traces
   - Monitors Kubernetes resources

3. **DataDog Cluster Agent**
   - Cluster-level monitoring
   - Kubernetes event collection
   - Orchestrator Explorer integration

### 📊 Monitoring Capabilities

With DataDog enabled, you'll have:

- **APM (Application Performance Monitoring)**
  - Request tracing
  - Performance bottleneck identification
  - Service dependency mapping

- **Infrastructure Monitoring**
  - CPU, Memory, Disk, Network metrics
  - Container-level metrics
  - Kubernetes pod/deployment health

- **Log Management**
  - Centralized log collection
  - Log correlation with traces
  - Advanced log search and filtering

- **Real User Monitoring (RUM)**
  - Frontend performance tracking
  - User session replay
  - Core Web Vitals monitoring

- **Kubernetes Monitoring**
  - Pod/Deployment/Service metrics
  - Orchestrator Explorer
  - Kubernetes State Metrics
  - Resource utilization dashboards

---

## Verification Steps

### 1. Check DataDog Deployment in Kubernetes

```bash
# Check DataDog pods
kubectl get pods -n monitoring | grep datadog

# Expected output:
# datadog-agent-cluster-agent-xxxxx   1/1     Running
# datadog-agent-xxxxx                 5/5     Running
```

### 2. Check DataDog Dashboard

1. **Log in to DataDog:**
   - Go to: https://app.datadoghq.com/ (or your region's URL)
   - Use your DataDog account credentials

2. **Verify Data is Flowing:**
   - Navigate to: **Infrastructure → Kubernetes**
   - You should see your `ecommerce-k8s` cluster
   - Check: **APM → Services** for application traces
   - Check: **Logs** for log collection

### 3. View Key Metrics

Navigate to these dashboards in DataDog:

- **Kubernetes Overview**: Infrastructure → Kubernetes
- **APM Services**: APM → Services
- **Logs**: Logs → Explorer
- **Orchestrator Explorer**: Infrastructure → Orchestrator Explorer

---

## Current Deployment Status

### ✅ Already Deployed (Working)

- **Frontend Application**: 3/3 pods running
- **PostgreSQL Database**: 1/1 pod running, freshly initialized
- **Redis Cache**: 1/1 pod running
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Jaeger**: Distributed tracing
- **AlertManager**: Alert routing

### ⏳ Pending (After Adding API Key)

- **DataDog Operator**: Will be deployed automatically
- **DataDog Agent**: Will start collecting metrics
- **DataDog Cluster Agent**: Will monitor Kubernetes cluster

---

## Alternative: Manual DataDog Deployment

If you prefer to deploy DataDog manually (without waiting for CI/CD):

```bash
# Set the API key
export DATADOG_API_KEY=70f5b7b9c5c5f198b76c8823c9a7b38d

# Deploy DataDog
cd "/Users/pavan/Pictures/MY-lesnpic-full-edited folders/LOCAL-documents/e-commerce-ui/k8s-manifests/monitoring"
./deploy-monitoring.sh
```

This will deploy the entire monitoring stack including DataDog.

---

## Troubleshooting

### Issue: DataDog pods not starting

**Check logs:**
```bash
kubectl logs -n monitoring -l app=datadog-agent
```

**Common issues:**
- Invalid API key → Verify key is correct
- Network issues → Check cluster internet access
- Resource limits → Increase if needed

### Issue: No data in DataDog dashboard

**Wait time:** It can take 2-5 minutes for data to appear

**Verify agent status:**
```bash
kubectl exec -n monitoring -l app=datadog-agent -- agent status
```

### Issue: Kubernetes metrics not showing

**Enable Kubernetes State Metrics:**
```bash
# Check if KSM is running
kubectl get pods -n kube-system | grep kube-state-metrics
```

---

## DataDog Configuration

### Current Settings (in deployment)

- **Site**: `us5.datadoghq.com`
- **Cluster Name**: `ecommerce-k8s`
- **APM Enabled**: Yes
- **Log Collection**: Yes
- **Process Agent**: Disabled (for performance)
- **Orchestrator Explorer**: Enabled
- **Kubelet TLS Verify**: Disabled (for Minikube compatibility)

### Environment Variables (for frontend)

The following DataDog environment variables are configured in the frontend deployment:

- `NEXT_PUBLIC_DATADOG_APPLICATION_ID`: (Set in GitHub secrets)
- `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`: (Set in GitHub secrets)
- `NEXT_PUBLIC_DATADOG_SITE`: `datadoghq.com`
- `NEXT_PUBLIC_DATADOG_SERVICE`: `ecommerce-frontend`
- `NEXT_PUBLIC_DATADOG_ENV`: `production`

---

## Complete Monitoring Stack Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Monitoring Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Prometheus                                           │
│  └─ Metrics collection from all services                │
│                                                          │
│  📈 Grafana                                              │
│  └─ Dashboards and visualizations                       │
│     └─ Auto-configured with Prometheus datasource       │
│                                                          │
│  🚨 AlertManager                                         │
│  └─ Alert routing and notifications                     │
│     └─ Multi-tier routing (critical/warning/info)       │
│                                                          │
│  🔍 Jaeger                                               │
│  └─ Distributed tracing                                 │
│     └─ Request flow visualization                       │
│                                                          │
│  🐕 DataDog (Once API key is added)                     │
│  ├─ APM (Application Performance Monitoring)            │
│  ├─ Infrastructure monitoring                           │
│  ├─ Log management                                      │
│  ├─ Real User Monitoring (RUM)                          │
│  └─ Kubernetes monitoring                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ **Add DataDog API key to GitHub Secrets** (see Step 1 above)
2. ✅ **Trigger CI/CD pipeline** (push a commit or manual trigger)
3. ✅ **Verify DataDog deployment** (check pods and dashboard)
4. ✅ **Configure dashboards** (customize DataDog views)
5. ✅ **Set up alerts** (configure alert policies)

---

## Success Metrics

After DataDog is deployed, you'll have:

- **100% Monitoring Coverage**: All services monitored
- **End-to-End Visibility**: From frontend to database
- **Proactive Alerting**: Issues detected before users notice
- **Performance Insights**: Bottleneck identification
- **Compliance**: Enterprise-grade monitoring stack

---

## 🎉 Congratulations!

Once DataDog is deployed, you'll have a **world-class monitoring stack** that rivals production systems at top tech companies!

### Final Deployment Checklist

- [x] ✅ Frontend Application (3 pods running)
- [x] ✅ PostgreSQL Database (initialized with correct credentials)
- [x] ✅ Redis Cache
- [x] ✅ Prometheus + Grafana
- [x] ✅ Jaeger Distributed Tracing
- [x] ✅ AlertManager
- [x] ✅ CI/CD Pipeline (with self-hosted runner)
- [ ] ⏳ DataDog APM (pending API key setup)

**You're one step away from complete production readiness!** 🚀

