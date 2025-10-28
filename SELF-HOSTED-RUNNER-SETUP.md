# 🚀 SELF-HOSTED RUNNER SETUP GUIDE

## 📋 OVERVIEW

This guide will help you set up a GitHub Actions self-hosted runner on your local machine to connect GitHub CI/CD pipeline to your existing Minikube cluster.

## 🎯 WHAT THIS ACHIEVES

- ✅ GitHub Actions runs quality checks, security scans, and builds in the cloud
- ✅ Deployment happens to YOUR local Minikube cluster
- ✅ All monitoring, ingress, and Kubernetes components preserved
- ✅ Fast iteration with existing cluster (no spin-up time)

---

## 📋 PREREQUISITES

### 1. Minikube Running
```bash
# Start Minikube if not running
minikube start

# Verify status
minikube status

# Should show:
# host: Running
# kubelet: Running
# apiserver: Running
```

### 2. Required Addons Enabled
```bash
# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard

# Verify addons
minikube addons list | grep enabled
```

---

## 🔧 STEP 1: CREATE SELF-HOSTED RUNNER

### 1.1 Go to Repository Settings
1. Open your repository: `https://github.com/pavan-official/pavan-e-commerce-ui`
2. Click **Settings** (top menu)
3. Scroll down and click **Actions** → **Runners** (left sidebar)
4. Click **New self-hosted runner** button

### 1.2 Select Your Operating System
- For macOS: Select **macOS**
- For Linux: Select **Linux**
- For Windows: Select **Windows**

---

## 🚀 STEP 2: INSTALL RUNNER (macOS)

### 2.1 Create Runner Directory
```bash
# Create directory for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner
```

### 2.2 Download Runner
```bash
# Download latest runner package (macOS ARM64)
curl -o actions-runner-osx-arm64-2.313.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-osx-arm64-2.313.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-osx-arm64-2.313.0.tar.gz
```

**Note:** If you're on Intel Mac, use:
```bash
curl -o actions-runner-osx-x64-2.313.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-osx-x64-2.313.0.tar.gz
tar xzf ./actions-runner-osx-x64-2.313.0.tar.gz
```

### 2.3 Configure Runner
```bash
# Configure the runner
# Replace TOKEN with the token shown on GitHub
./config.sh --url https://github.com/pavan-official/pavan-e-commerce-ui \
  --token YOUR_TOKEN_FROM_GITHUB

# When prompted:
# - Enter runner name: ecommerce-local-runner
# - Enter runner group: Default
# - Enter work folder: _work
```

### 2.4 Start Runner
```bash
# Start the runner
./run.sh
```

**For background running:**
```bash
# Install as service (optional)
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

---

## 🚀 STEP 3: INSTALL RUNNER (Linux)

### 3.1 Create Runner Directory
```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
```

### 3.2 Download Runner
```bash
# Download latest runner package (Linux x64)
curl -o actions-runner-linux-x64-2.313.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-linux-x64-2.313.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.313.0.tar.gz
```

### 3.3 Configure and Start
```bash
# Configure
./config.sh --url https://github.com/pavan-official/pavan-e-commerce-ui \
  --token YOUR_TOKEN_FROM_GITHUB

# Start
./run.sh
```

---

## ✅ STEP 4: VERIFY SETUP

### 4.1 Check Runner Status
1. Go to **Settings** → **Actions** → **Runners**
2. You should see your runner with:
   - **Status:** 🟢 Idle (green)
   - **Name:** ecommerce-local-runner

### 4.2 Verify Minikube Access
```bash
# Runner should be able to access Minikube
minikube status

# Runner should be able to use kubectl
kubectl cluster-info
kubectl get nodes
```

---

## 🎯 STEP 5: TEST THE PIPELINE

### 5.1 Trigger Workflow
```bash
# Make a small change and push
cd ~/path/to/e-commerce-ui
echo "# Test" >> README.md
git add README.md
git commit -m "Test self-hosted runner"
git push origin main
```

### 5.2 Monitor Execution
1. Go to **Actions** tab on GitHub
2. Click on your workflow run
3. Watch as:
   - ✅ Quality checks run in GitHub cloud
   - ✅ Security scan runs in GitHub cloud
   - ✅ Build runs in GitHub cloud
   - ✅ **Deployment runs on YOUR local Minikube!**

---

## 🔍 STEP 6: VERIFY DEPLOYMENT

### 6.1 Check Pods
```bash
# Check if pods are running
kubectl get pods -n ecommerce-production

# Should show:
# NAME                                     READY   STATUS    RESTARTS   AGE
# ecommerce-frontend-deployment-xxx        1/1     Running   0          2m
# postgres-xxx                             1/1     Running   0          2m
# redis-xxx                                1/1     Running   0          2m
```

### 6.2 Access Application
```bash
# Get service URL
minikube service ecommerce-frontend-service -n ecommerce-production --url

# Or use port-forward
kubectl port-forward svc/ecommerce-frontend-service -n ecommerce-production 3000:80

# Open browser
open http://localhost:3000
```

### 6.3 Check Monitoring Stack
```bash
# Prometheus
minikube service prometheus-service -n monitoring --url

# Grafana
minikube service grafana-service -n monitoring --url

# Jaeger
minikube service jaeger-query -n monitoring --url

# Kubernetes Dashboard
minikube dashboard
```

---

## 🎉 SUCCESS!

You now have a complete CI/CD pipeline where:
- ✅ GitHub Actions runs quality checks in the cloud
- ✅ Deployments happen to your local Minikube
- ✅ All Kubernetes components preserved
- ✅ Full monitoring stack available
- ✅ Fast iteration (no cluster spin-up)

---

## 🔧 TROUBLESHOOTING

### Runner Not Connecting
```bash
# Check runner logs
cd ~/actions-runner
tail -f _diag/Runner_*.log
```

### Minikube Not Accessible
```bash
# Verify Minikube is running
minikube status

# Restart if needed
minikube stop
minikube start

# Verify kubectl context
kubectl config current-context
```

### Deployment Failures
```bash
# Check workflow logs on GitHub Actions
# Check pod logs
kubectl logs -f deployment/ecommerce-frontend-deployment -n ecommerce-production

# Check events
kubectl get events -n ecommerce-production --sort-by='.lastTimestamp'
```

### Runner Stuck
```bash
# Stop runner
cd ~/actions-runner
./svc.sh stop  # If running as service
# OR press Ctrl+C if running in foreground

# Clean up
./config.sh remove --token YOUR_TOKEN

# Reconfigure
./config.sh --url https://github.com/pavan-official/pavan-e-commerce-ui --token NEW_TOKEN
./run.sh
```

---

## 🛡️ SECURITY NOTES

1. **Runner has full access to your machine**
   - Only use on trusted repositories
   - Your runner can execute any code from the repository

2. **Minikube access**
   - Runner can deploy to your local Minikube
   - Keep your machine secure

3. **Secrets**
   - GitHub secrets are available to self-hosted runners
   - Be cautious with sensitive data

---

## 📊 PERFORMANCE BENEFITS

| Approach | Startup Time | Build Time | Deploy Time | Total Time |
|----------|-------------|------------|-------------|------------|
| **GitHub-hosted (spin up Minikube)** | 2-3 min | 3-5 min | 2-3 min | **7-11 min** |
| **Self-hosted (existing Minikube)** | 0 sec | 3-5 min | 1-2 min | **4-7 min** |

**⚡ 30-40% FASTER!**

---

## 🎯 NEXT STEPS

1. ✅ Keep Minikube running during work hours
2. ✅ Deploy changes as needed via `git push`
3. ✅ Monitor application through Minikube services
4. ✅ Use all Kubernetes features (ingress, monitoring, etc.)

---

## 🔄 MAINTENANCE

### Daily
- Ensure Minikube is running before pushing code
- Monitor runner status on GitHub

### Weekly
- Update runner to latest version
- Clean up Docker images: `eval $(minikube docker-env) && docker system prune -f`

### Monthly
- Update Minikube: `minikube update-check`
- Update kubectl: `brew upgrade kubectl` (macOS)

---

**🎉 You're all set! Your CI/CD pipeline now uses your local Minikube cluster!** 🚀

