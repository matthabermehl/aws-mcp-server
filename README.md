# AWS MCP (Multi-Cloud Platform) Server

## Overview

The AWS MCP Server is a Dockerized HTTP server designed to expose various AWS SDK functionalities through a collection of JavaScript-based tools. Its primary purpose is to provide a standardized and accessible way to interact with AWS services by making HTTP requests to dynamically generated API endpoints. Each endpoint corresponds to a specific AWS service action defined in the `tools/` directory.

## Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **AWS credentials** with appropriate permissions

### Basic Setup

1. **Clone and navigate to the repository**
2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```
3. **Start the server**:
   ```bash
   docker-compose up -d
   ```
4. **Test the server**:
   ```bash
   curl http://localhost:3000/routes
   ```

## Deployment Options

### Option 1: Standalone with External Access (Default)

For direct access from outside Docker:

```bash
# In docker-compose.yml, uncomment the ports section:
ports:
  - "3000:3000"

docker-compose up -d
```

Access at: `http://localhost:3000`

### Option 2: Internal Docker Network Only

For integration with other containerized services (like n8n, automation tools):

```bash
# Set custom network in .env file
echo "DOCKER_NETWORK=your_network_name" >> .env

# Create or use existing network
docker network create your_network_name

# Start without external ports (default configuration)
docker-compose up -d
```

Access from other containers: `http://aws-mcp-server:3000`

### Option 3: Integration with Existing Docker Compose Stack

Add to your existing `docker-compose.yml`:

```yaml
services:
  aws-mcp-server:
    image: your-registry/aws-mcp-server  # or build: path/to/aws-mcp-server
    container_name: aws-mcp-server
    env_file:
      - path/to/aws-mcp-server/.env
    networks:
      - your_existing_network
    expose:
      - "3000"
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Required AWS credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_DEFAULT_REGION=us-east-1

# Optional: For temporary credentials
# AWS_SESSION_TOKEN=your_session_token

# Server configuration
PORT=3000

# Docker network (optional)
# DOCKER_NETWORK=your_custom_network_name
```

### AWS Credentials Options

1. **IAM User**: Create dedicated IAM user with required permissions
2. **IAM Role**: Use EC2 instance profile or ECS task role
3. **Temporary Credentials**: Use STS assume role with session token
4. **AWS CLI Profile**: Mount `~/.aws` directory (not recommended for production)

## Available AWS Services

The server provides **116 tools** across these AWS services:

- **CloudWatch Logs** (9 tools) - Log management and querying
- **CloudTrail** (2 tools) - API call auditing
- **Config Service** (19 tools) - Resource configuration tracking
- **EC2** (16 tools) - Virtual machine management
- **ECS** (10 tools) - Container orchestration
- **GuardDuty** (10 tools) - Threat detection
- **Health Client** (6 tools) - Service health monitoring
- **IAM** (13 tools) - Identity and access management
- **Lambda** (12 tools) - Serverless functions
- **Route 53** (3 tools) - DNS management
- **S3** (11 tools) - Object storage
- **SSM** (5 tools) - Systems management

## API Usage

### Discovering Available Tools

```bash
curl http://localhost:3000/routes
```

### Calling AWS Tools

All tools use POST requests to `/tools/{service}/{tool}`:

```bash
# List S3 buckets
curl -X POST http://localhost:3000/tools/s3/ListBuckets \
  -H "Content-Type: application/json" \
  -d '{"region": "us-east-1"}'

# Describe EC2 instances
curl -X POST http://localhost:3000/tools/ec2/DescribeInstances \
  -H "Content-Type: application/json" \
  -d '{
    "region": "us-east-1",
    "instanceIds": ["i-1234567890abcdef0"]
  }'
```

## Integration Examples

### With n8n Workflow Automation

1. Deploy both services on same Docker network
2. Use HTTP Request nodes in n8n
3. Set URL to `http://aws-mcp-server:3000/tools/{service}/{tool}`

### With Custom Applications

```javascript
// Example: List S3 buckets from Node.js
const response = await fetch('http://aws-mcp-server:3000/tools/s3/ListBuckets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ region: 'us-east-1' })
});
const buckets = await response.json();
```

### With CI/CD Pipelines

```yaml
# Example: GitHub Actions
- name: Check AWS Resources
  run: |
    curl -X POST http://aws-mcp-server:3000/tools/ec2/DescribeInstances \
      -H "Content-Type: application/json" \
      -d '{"region": "us-east-1"}'
```

## Security Considerations

- **Network Isolation**: Use internal Docker networks for production
- **Credential Management**: Use IAM roles instead of access keys when possible
- **Access Control**: Implement authentication/authorization layer if needed
- **Monitoring**: Enable CloudTrail to monitor API usage

## Development

### Building from Source

```bash
git clone <repository-url>
cd aws-mcp-server
docker build -t aws-mcp-server .
```

### Local Development

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### Adding New Tools

1. Create new tool class in `tools/` directory
2. Follow existing patterns for parameter validation
3. Export tool in the service module
4. Restart server to load new tools

## Troubleshooting

### Common Issues

1. **Container won't start**: Check `.env` file exists and has valid AWS credentials
2. **Network connectivity**: Ensure containers are on the same Docker network
3. **AWS permissions**: Verify IAM user/role has required permissions
4. **Port conflicts**: Change PORT environment variable if 3000 is in use

### Debugging

```bash
# View container logs
docker logs aws-mcp-server

# Test network connectivity from another container
docker exec other-container curl http://aws-mcp-server:3000/routes

# Validate AWS credentials
docker exec aws-mcp-server aws sts get-caller-identity
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

[Add your license information here]
