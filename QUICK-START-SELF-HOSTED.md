# 🚀 QUICK START - Self-Hosted Runner

## ⚡ 3-MINUTE SETUP

### Step 1: Get Runner Token
1. Go to: https://github.com/pavan-official/pavan-e-commerce-ui/settings/actions/runners/new
2. Copy the token shown

### Step 2: Install Runner (macOS)
```bash
# Create directory
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download (ARM64 Mac)
curl -o actions-runner-osx-arm64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.313.0/actions-runner-osx-arm64-2.313.0.tar.gz
tar xzf ./actions-runner-osx-arm64.tar.gz

# Configure
./config.sh --url https://github.com/pavan-official/pavan-e-commerce-ui --token YOUR_TOKEN

# Start
./run.sh
```

### Step 3: Verify Minikube
```bash
minikube status
# Should show: Running
```

### Step 4: Test Pipeline
```bash
cd ~/path/to/e-commerce-ui
git push origin main
```

## ✅ DONE!

Watch GitHub Actions deploy to YOUR local Minikube! 🎉

---

## 📊 What You Get

- ✅ Full Kubernetes cluster with all components
- ✅ Prometheus, Grafana, Jaeger monitoring
- ✅ Ingress controller
- ✅ Fast deployments (no cluster startup)
- ✅ All bells and whistles!

---

For detailed setup, see: **SELF-HOSTED-RUNNER-SETUP.md**
