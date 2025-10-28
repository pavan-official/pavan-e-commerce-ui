# 🚀 CONNECT TO EXISTING MINIKUBE - DEPLOYMENT GUIDE

## 📋 OVERVIEW

Instead of spinning up a new Minikube cluster each time (which takes 2-3 minutes), you can **connect to an already running Minikube cluster**. This is **MUCH FASTER** and more efficient for development!

## 🎯 WHY THIS IS BETTER

| Approach | Startup Time | Build Time | Total Time |
|----------|-------------|------------|------------|
| **Spin up new Minikube** | 2-3 min | 3-5 min | **7-11 min** |
| **Use existing Minikube** | 0 sec | 2-3 min | **2-3 min** |

**⚡ 70-80% FASTER!**

## 🛠️ OPTION 1: LOCAL SCRIPT (EASIEST)

### Prerequisites
1. **Minikube must be running**
```bash
minikube start
```

2. **Check Minikube status**
```bash
minikube status
```

### Quick Deploy
```bash
# Make script executable
chmod +x scripts/deploy-to-existing-minikube.sh

# Deploy to existing Minikube
./scripts/deploy-to-existing-minikube.sh
```

### Custom Configuration
```bash
# Deploy to specific namespace
NAMESPACE=my-namespace ./scripts/deploy-to-existing-minikube.sh

# Deploy with custom profile
MINIKUBE_PROFILE=dev-cluster ./scripts/deploy-to-existing-minikube.sh

# Deploy with specific image tag
IMAGE_TAG=v1.2.3 ./scripts/deploy-to-existing-minikube.sh

# Combine all options
MINIKUBE_PROFILE=dev-cluster \
NAMESPACE=production \
IMAGE_TAG=v1.2.3 \
./scripts/deploy-to-existing-minikube.sh
```

## 🛠️ OPTION 2: GITHUB ACTIONS WITH SELF-HOSTED RUNNER

### What is a Self-Hosted Runner?
A **self-hosted runner** is GitHub Actions running on YOUR local machine, so it can access your existing Minikube cluster.

### Setup Self-Hosted Runner

#### Step 1: Go to GitHub Settings
1. Open your repository on GitHub
2. Go to **Settings** → **Actions** → **Runners**
3. Click **New self-hosted runner**

#### Step 2: Download and Configure Runner
```bash
# Create a folder for the runner
mkdir actions-runner && cd actions-runner

# Download the runner (macOS)
curl -o actions-runner-osx-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-osx-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-osx-x64-2.311.0.tar.gz

# Configure the runner
./config.sh --url https://github.com/YOUR-USERNAME/YOUR-REPO --token YOUR-TOKEN

# Start the runner
./run.sh
```

#### Step 3: Trigger Workflow
```bash
# Go to Actions tab in GitHub
# Select "Local Minikube CI/CD Pipeline"
# Click "Run workflow"
# Enter your Minikube profile and namespace
# Click "Run workflow"
```

## 🛠️ OPTION 3: MANUAL KUBECTL DEPLOYMENT

### Step 1: Build Image in Minikube
```bash
# Connect to Minikube's Docker daemon
eval $(minikube docker-env)

# Build image
cd client
docker build -t ecommerce-frontend:latest .
```

### Step 2: Deploy to Kubernetes
```bash
# Create namespace
kubectl create namespace ecommerce-production

# Deploy application
cd ../k8s-manifests/scripts
chmod +x deploy.sh
NAMESPACE=ecommerce-production ./deploy.sh production minikube
```

### Step 3: Wait for Deployment
```bash
# Wait for pods to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/ecommerce-frontend-deployment \
  -n ecommerce-production

# Check status
kubectl get pods -n ecommerce-production
```

### Step 4: Access Application
```bash
# Get service URL
minikube service ecommerce-frontend-service -n ecommerce-production --url

# Or use port-forward
kubectl port-forward svc/ecommerce-frontend-service -n ecommerce-production 3000:80
```

## 🎯 REAL-WORLD DEVELOPMENT WORKFLOW

### Morning Setup (Once)
```bash
# 1. Start Minikube
minikube start

# 2. Enable necessary addons
minikube addons enable metrics-server
minikube addons enable registry

# 3. Verify cluster is ready
kubectl cluster-info
```

### During Development (Multiple times per day)
```bash
# 1. Make code changes
# ... edit files ...

# 2. Deploy changes (takes 2-3 minutes)
./scripts/deploy-to-existing-minikube.sh

# 3. Test changes
open $(minikube service ecommerce-frontend-service -n ecommerce-production --url)

# 4. View logs if needed
kubectl logs -f deployment/ecommerce-frontend-deployment -n ecommerce-production
```

### Evening Cleanup (Optional)
```bash
# Stop Minikube (saves resources)
minikube stop

# OR keep it running for next day
# (faster startup next time)
```

## 🔧 ADVANCED SCENARIOS

### Multiple Minikube Profiles
```bash
# Create different profiles for different environments
minikube start -p dev
minikube start -p staging
minikube start -p testing

# Deploy to specific profile
MINIKUBE_PROFILE=dev ./scripts/deploy-to-existing-minikube.sh
MINIKUBE_PROFILE=staging ./scripts/deploy-to-existing-minikube.sh
```

### Hot Reload Development
```bash
# Use Skaffold for automatic rebuilds
skaffold dev --port-forward

# OR use Tilt for visual development
tilt up
```

### Docker Compose Alternative
```bash
# For even faster local development (no Kubernetes)
docker-compose -f docker-compose.fast.yml up

# Takes only 10-30 seconds!
```

## 🚀 PERFORMANCE COMPARISON

### Traditional Approach (Spin up new cluster)
```
1. Start Minikube:     2-3 minutes
2. Build image:        3-5 minutes
3. Deploy:             2-3 minutes
4. Wait for ready:     1-2 minutes
--------------------------------
Total:                 8-13 minutes
```

### Optimized Approach (Use existing cluster)
```
1. Minikube already running:  0 seconds
2. Build image:               2-3 minutes
3. Deploy:                    30 seconds
4. Wait for ready:            30 seconds
--------------------------------
Total:                        3-4 minutes
```

**⚡ 70% FASTER!**

## 📊 MONITORING YOUR DEPLOYMENT

### Check Deployment Status
```bash
# Pod status
kubectl get pods -n ecommerce-production -w

# Deployment status
kubectl rollout status deployment/ecommerce-frontend-deployment -n ecommerce-production

# Events
kubectl get events -n ecommerce-production --sort-by='.lastTimestamp'
```

### View Logs
```bash
# Follow logs
kubectl logs -f deployment/ecommerce-frontend-deployment -n ecommerce-production

# Last 100 lines
kubectl logs --tail=100 deployment/ecommerce-frontend-deployment -n ecommerce-production

# All containers in pod
kubectl logs -f pod/POD-NAME -n ecommerce-production --all-containers=true
```

### Resource Usage
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n ecommerce-production

# Minikube dashboard
minikube dashboard
```

## 🐛 TROUBLESHOOTING

### Issue: Image not found
```bash
# Solution: Rebuild image in Minikube's Docker daemon
eval $(minikube docker-env)
cd client
docker build -t ecommerce-frontend:latest .
```

### Issue: Pods in CrashLoopBackOff
```bash
# Check logs
kubectl logs pod/POD-NAME -n ecommerce-production

# Describe pod for events
kubectl describe pod/POD-NAME -n ecommerce-production

# Restart deployment
kubectl rollout restart deployment/ecommerce-frontend-deployment -n ecommerce-production
```

### Issue: Minikube not responding
```bash
# Check status
minikube status

# Restart Minikube
minikube stop
minikube start

# Or delete and recreate
minikube delete
minikube start
```

## 🎯 BEST PRACTICES

### 1. **Keep Minikube Running During Development**
- Start once in the morning
- Deploy changes as needed
- Stop at end of day

### 2. **Use Image Tags**
- Tag images with git SHA or version
- Makes rollbacks easier
- Helps with debugging

### 3. **Monitor Resource Usage**
- Minikube can consume resources
- Adjust Minikube resources as needed:
```bash
minikube config set memory 4096
minikube config set cpus 2
```

### 4. **Clean Up Regularly**
```bash
# Remove old images
eval $(minikube docker-env)
docker system prune -f

# Remove old pods
kubectl delete pods --field-selector status.phase=Failed -n ecommerce-production
```

## 🎉 CONCLUSION

Using an **existing Minikube cluster** is:
- ✅ **70% faster** than spinning up new clusters
- ✅ **More efficient** for development
- ✅ **Easier to debug** (persistent state)
- ✅ **Industry standard** approach

This is how **real developers work in companies!** 🚀

