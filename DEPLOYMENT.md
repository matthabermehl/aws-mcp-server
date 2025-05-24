# AWS MCP Server Deployment Guide

This guide provides specific deployment examples for different use cases and environments.

## Deployment Scenarios

### 1. Standalone Development Setup

**Use case**: Local development, testing, direct API access

```bash
# Clone repository
git clone <your-repo-url>
cd aws-mcp-server

# Create environment file
cat > .env << EOF
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
PORT=3000
EOF

# Enable external access in docker-compose.yml
# Uncomment the ports section:
# ports:
#   - "3000:3000"

# Start server
docker-compose up -d

# Test
curl http://localhost:3000/routes
```

### 2. n8n Integration

**Use case**: Workflow automation with n8n

```bash
# Create shared network
docker network create automation_network

# Set up AWS MCP Server
cat > .env << EOF
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=us-east-1
DOCKER_NETWORK=automation_network
EOF

# Start AWS MCP Server (no external ports)
docker-compose up -d

# Start n8n on same network
docker run -d \
  --name n8n \
  --network automation_network \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n

# In n8n workflows, use: http://aws-mcp-server:3000
```

### 3. Microservices Architecture

**Use case**: Part of larger containerized application

```yaml
# docker-compose.yml for your application stack
version: '3.8'

services:
  aws-mcp-server:
    build: ./aws-mcp-server
    container_name: aws-mcp-server
    env_file:
      - ./aws-mcp-server/.env
    networks:
      - backend
    expose:
      - "3000"

  your-app:
    build: ./your-app
    depends_on:
      - aws-mcp-server
    networks:
      - backend
      - frontend
    environment:
      - AWS_MCP_URL=http://aws-mcp-server:3000

  nginx:
    image: nginx
    ports:
      - "80:80"
    networks:
      - frontend

networks:
  backend:
    internal: true
  frontend:
```

### 4. Production with Reverse Proxy

**Use case**: Production deployment with HAProxy/Nginx

```bash
# HAProxy configuration example
backend aws_mcp
    server aws-mcp-1 aws-mcp-server:3000 check

frontend api
    bind *:443 ssl crt /path/to/cert.pem
    acl is_aws_mcp path_beg /aws-mcp
    http-request replace-path /aws-mcp(.*) \1 if is_aws_mcp
    use_backend aws_mcp if is_aws_mcp
```

### 5. Kubernetes Deployment

**Use case**: Kubernetes cluster deployment

```yaml
# aws-mcp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: aws-mcp-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: aws-mcp-server
  template:
    metadata:
      labels:
        app: aws-mcp-server
    spec:
      containers:
      - name: aws-mcp-server
        image: your-registry/aws-mcp-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: secret-access-key
        - name: AWS_DEFAULT_REGION
          value: "us-east-1"
---
apiVersion: v1
kind: Service
metadata:
  name: aws-mcp-service
spec:
  selector:
    app: aws-mcp-server
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

### 6. CI/CD Integration

**Use case**: Automated testing and deployment

```yaml
# GitHub Actions example
name: Deploy AWS MCP Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Build and deploy
      run: |
        # Build image
        docker build -t aws-mcp-server .
        
        # Create environment file
        cat > .env << EOF
        AWS_ACCESS_KEY_ID=${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY=${{ secrets.AWS_SECRET_ACCESS_KEY }}
        AWS_DEFAULT_REGION=us-east-1
        DOCKER_NETWORK=production_network
        EOF
        
        # Deploy
        docker-compose up -d
        
        # Health check
        sleep 10
        curl -f http://localhost:3000/routes || exit 1
```

## Network Configuration Examples

### Custom Docker Network

```bash
# Create custom network with specific subnet
docker network create \
  --driver bridge \
  --subnet=172.20.0.0/16 \
  --ip-range=172.20.240.0/20 \
  custom_aws_network

# Update .env
echo "DOCKER_NETWORK=custom_aws_network" >> .env
```

### Multiple Environment Setup

```bash
# Development environment
cat > .env.dev << EOF
AWS_ACCESS_KEY_ID=dev_access_key
AWS_SECRET_ACCESS_KEY=dev_secret_key
AWS_DEFAULT_REGION=us-west-2
DOCKER_NETWORK=dev_network
EOF

# Production environment
cat > .env.prod << EOF
AWS_ACCESS_KEY_ID=prod_access_key
AWS_SECRET_ACCESS_KEY=prod_secret_key
AWS_DEFAULT_REGION=us-east-1
DOCKER_NETWORK=prod_network
EOF

# Deploy with specific environment
docker-compose --env-file .env.dev up -d
```

## Security Best Practices

### 1. IAM Role-based Access (Recommended)

```bash
# Use IAM roles instead of access keys
# Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from .env
# Ensure EC2 instance or ECS task has appropriate IAM role

cat > .env << EOF
AWS_DEFAULT_REGION=us-east-1
DOCKER_NETWORK=secure_network
EOF
```

### 2. Network Isolation

```bash
# Create isolated network
docker network create --internal secure_aws_network

# Only allow specific containers
docker run --network secure_aws_network your-trusted-app
```

### 3. Secrets Management

```bash
# Use Docker secrets (Docker Swarm)
echo "your_secret_key" | docker secret create aws_secret_key -

# Reference in compose file:
# secrets:
#   - aws_secret_key
```

## Monitoring and Logging

### Health Checks

```bash
# Add health check to docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/routes"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Logging Configuration

```bash
# Configure logging driver
docker-compose up -d --log-driver=json-file --log-opt max-size=10m
```

## Troubleshooting Common Issues

### Network Connectivity

```bash
# Test network connectivity between containers
docker exec container1 ping aws-mcp-server
docker exec container1 curl http://aws-mcp-server:3000/routes
```

### AWS Credentials

```bash
# Validate credentials inside container
docker exec aws-mcp-server aws sts get-caller-identity
```

### Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep 3000

# Use different port
echo "PORT=3001" >> .env
```

This deployment guide should help users understand how to adapt the AWS MCP server to their specific needs while maintaining the flexibility for different deployment scenarios. 