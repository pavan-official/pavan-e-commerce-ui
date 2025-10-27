#!/bin/bash

# DataDog Operator Deployment Script
# Based on: https://docs.datadoghq.com/containers/kubernetes/?tab=datadogoperator

set -e

echo "🚀 Deploying DataDog Operator..."

# Check if DATADOG_API_KEY is provided
if [ -z "$DATADOG_API_KEY" ]; then
    echo "❌ Error: DATADOG_API_KEY environment variable is required"
    echo "Usage: DATADOG_API_KEY=your-api-key ./deploy-datadog-operator.sh"
    exit 1
fi

# Create namespace if it doesn't exist
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Create DataDog secret
kubectl create secret generic datadog-secret \
    --from-literal=api-key="$DATADOG_API_KEY" \
    -n monitoring \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ DataDog secret created"

# Deploy DataDog Operator
kubectl apply -f datadog-operator.yaml

echo "⏳ Waiting for DataDog Operator to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/datadog-operator -n datadog-operator

echo "✅ DataDog Operator is ready"

# Deploy DataDog Agent using Custom Resource
kubectl apply -f datadog-agent-cr.yaml

echo "⏳ Waiting for DataDog Agent to be ready..."
kubectl wait --for=condition=available --timeout=300s daemonset/datadog-agent -n monitoring

echo "✅ DataDog Agent is ready"

# Check DataDog Agent status
echo "📊 DataDog Agent Status:"
kubectl get pods -n monitoring | grep datadog

echo "🎉 DataDog Operator deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Check DataDog UI: https://us5.datadoghq.com"
echo "2. Verify Infrastructure > Kubernetes tab"
echo "3. Check Infrastructure > Host Map"
echo "4. Monitor APM > Services"
echo ""
echo "🔍 Troubleshooting:"
echo "- Check agent logs: kubectl logs -n monitoring -l app=datadog-agent"
echo "- Check operator logs: kubectl logs -n datadog-operator -l app=datadog-operator"
echo "- Verify secret: kubectl get secret datadog-secret -n monitoring"
