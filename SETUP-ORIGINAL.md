# AWS MCP Server Setup for n8n Integration

## Overview

The AWS MCP Server has been configured to run within the same Docker network as n8n, making it accessible only from within the Docker network for security.

## Configuration

### Docker Network
- **Network Name**: `run_lbnet`
- **Access**: Internal only (no external ports exposed)
- **Container Name**: `aws-mcp-server`
- **Internal Port**: 3000

### Files Created/Modified

1. **`docker-compose.yml`** - Container configuration
2. **Updated `~/docker-start.sh`** - Includes AWS MCP server startup
3. **Updated `~/docker-stop.sh`** - Includes AWS MCP server shutdown

### Environment Variables

The AWS MCP server uses your existing `.env` file with the following required variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_DEFAULT_REGION`
- `AWS_SESSION_TOKEN` (optional, for temporary credentials)

## Network Access

From within the Docker network (e.g., from n8n), the AWS MCP server is accessible at:
- **URL**: `http://aws-mcp-server:3000`
- **Routes endpoint**: `http://aws-mcp-server:3000/routes`
- **Tools endpoint**: `http://aws-mcp-server:3000/tools/{service}/{tool}`

## Available Services

The AWS MCP server provides 116 tools across these AWS services:
- CloudWatch Logs (9 tools)
- CloudTrail (2 tools)
- Config Service (19 tools)
- EC2 (16 tools)
- ECS (10 tools)
- GuardDuty (10 tools)
- Health Client (6 tools)
- IAM (13 tools)
- Lambda (12 tools)
- Route 53 (3 tools)
- S3 (11 tools)
- SSM (5 tools)

## Usage from n8n

To use the AWS MCP server from n8n workflows:

1. Use HTTP Request nodes
2. Set the URL to `http://aws-mcp-server:3000/tools/{service}/{tool}`
3. Use POST method with JSON body containing the required parameters

Example:
```json
{
  "region": "us-east-1",
  "instanceIds": ["i-1234567890abcdef0"]
}
```

## Management Commands

- **Start all services**: `./docker-start.sh`
- **Stop all services**: `./docker-stop.sh`
- **Start AWS MCP only**: `cd ~/aws-mcp-server && docker-compose up -d`
- **Stop AWS MCP only**: `cd ~/aws-mcp-server && docker-compose down`
- **View logs**: `docker logs aws-mcp-server`

## Security

- No external ports are exposed
- Only accessible from within the `run_lbnet` Docker network
- Uses your existing AWS credentials from the `.env` file
- Runs as non-root user inside the container 