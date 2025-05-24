#!/bin/bash

# AWS MCP Server Start Script
# This script tears down the old container, rebuilds the image, and starts it with AWS credentials

set -e  # Exit on any error

echo "🚀 Starting AWS MCP Server deployment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your AWS credentials:"
    echo "AWS_ACCESS_KEY_ID=your_access_key"
    echo "AWS_SECRET_ACCESS_KEY=your_secret_key"
    echo "AWS_DEFAULT_REGION=your_region"
    exit 1
fi

# Source the .env file to load environment variables
echo "📋 Loading environment variables from .env file..."
export $(grep -v '^#' .env | xargs)

# Validate required environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_DEFAULT_REGION" ]; then
    echo "❌ Error: Missing required AWS credentials in .env file!"
    echo "Required variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION"
    exit 1
fi

echo "✅ AWS credentials loaded successfully"
echo "   Region: $AWS_DEFAULT_REGION"
echo "   Access Key: ${AWS_ACCESS_KEY_ID:0:8}..."

# Container and network names
CONTAINER_NAME="mcp-server"
NETWORK_NAME="mcp-network"
IMAGE_NAME="aws-mcp-server"
PORT="3000"

# Function to check if container exists
container_exists() {
    docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"
}

# Function to check if network exists
network_exists() {
    docker network ls --format "table {{.Name}}" | grep -q "^${NETWORK_NAME}$"
}

# Stop and remove existing container if it exists
if container_exists; then
    echo "🛑 Stopping existing container: $CONTAINER_NAME"
    docker stop $CONTAINER_NAME || true
    echo "🗑️  Removing existing container: $CONTAINER_NAME"
    docker rm $CONTAINER_NAME || true
else
    echo "ℹ️  No existing container found"
fi

# Create network if it doesn't exist
if ! network_exists; then
    echo "🌐 Creating Docker network: $NETWORK_NAME"
    docker network create $NETWORK_NAME
else
    echo "✅ Docker network already exists: $NETWORK_NAME"
fi

# Build the Docker image
echo "🔨 Building Docker image: $IMAGE_NAME"
docker build -t $IMAGE_NAME .

# Start the new container with AWS credentials
echo "🚀 Starting new container: $CONTAINER_NAME"
docker run -d \
    --name $CONTAINER_NAME \
    --network $NETWORK_NAME \
    -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
    -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
    -e AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
    -p $PORT:$PORT \
    $IMAGE_NAME

# Wait a moment for the container to start
echo "⏳ Waiting for container to start..."
sleep 3

# Check if container is running
if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ Container started successfully!"
    echo ""
    echo "📊 Container Status:"
    docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "🌐 Network Information:"
    docker network inspect $NETWORK_NAME --format "{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{end}}" | tr ' ' '\n'
    echo ""
    echo "📝 Server Logs (last 10 lines):"
    docker logs $CONTAINER_NAME --tail 10
    echo ""
    echo "🎯 MCP Server Endpoints:"
    echo "   Health Check: http://localhost:$PORT/"
    echo "   SSE Endpoint: http://localhost:$PORT/sse"
    echo "   Messages:     http://localhost:$PORT/messages"
    echo ""
    echo "🔗 For n8n connection use: http://mcp-server:$PORT/sse"
else
    echo "❌ Failed to start container!"
    echo "📝 Container logs:"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo "🎉 AWS MCP Server is ready!" 