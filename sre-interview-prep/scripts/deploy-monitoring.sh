#!/bin/bash

# SRE Interview Preparation: Deploy Complete Monitoring Stack
# DataDog + ELK + Java Monitoring

set -euo pipefail

echo "🚀 Deploying SRE Monitoring Stack for Interview Preparation"
echo "=========================================================="

# Create namespaces
echo "📁 Creating namespaces..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace logging --dry-run=client -o yaml | kubectl apply -f -

# Deploy DataDog Agent
echo "🐕 Deploying DataDog Agent..."
kubectl apply -f datadog/datadog-agent.yaml
kubectl apply -f datadog/datadog-config.yaml
kubectl apply -f datadog/datadog-secret.yaml

# Deploy ELK Stack
echo "📊 Deploying ELK Stack..."
kubectl apply -f elk/elasticsearch.yaml
kubectl apply -f elk/logstash.yaml
kubectl apply -f elk/kibana.yaml

# Deploy Java Monitoring
echo "☕ Deploying Java Monitoring..."
kubectl apply -f java-monitoring/java-jmx-config.yaml

# Create services
echo "🔗 Creating services..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: logging
spec:
  selector:
    app: elasticsearch
  ports:
  - port: 9200
    targetPort: 9200
  clusterIP: None
---
apiVersion: v1
kind: Service
metadata:
  name: kibana
  namespace: logging
spec:
  selector:
    app: kibana
  ports:
  - port: 5601
    targetPort: 5601
  type: LoadBalancer
---
apiVersion: v1
kind: Service
metadata:
  name: logstash
  namespace: logging
spec:
  selector:
    app: logstash
  ports:
  - port: 5044
    targetPort: 5044
  - port: 5000
    targetPort: 5000
EOF

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/logstash -n logging
kubectl wait --for=condition=available --timeout=300s deployment/kibana -n logging

echo "✅ Monitoring stack deployed successfully!"
echo ""
echo "🔍 Access Points:"
echo "- Kibana: kubectl port-forward svc/kibana 5601:5601 -n logging"
echo "- Elasticsearch: kubectl port-forward svc/elasticsearch 9200:9200 -n logging"
echo "- DataDog: Check your DataDog dashboard"
echo ""
echo "📚 Interview Preparation:"
echo "- Review incident response scenarios"
echo "- Practice troubleshooting methodology"
echo "- Study Java monitoring best practices"
echo "- Prepare for SRE interview questions"
