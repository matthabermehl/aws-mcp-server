# AWS MCP (Multi-Cloud Platform) Server

## Overview

The AWS MCP Server is a Dockerized HTTP server designed to expose various AWS SDK functionalities through a collection of JavaScript-based tools. Its primary purpose is to provide a standardized and accessible way to interact with AWS services by making HTTP requests to dynamically generated API endpoints. Each endpoint corresponds to a specific AWS service action defined in the `tools/` directory.

## Prerequisites

*   **Docker Desktop** (or any compatible Docker environment) installed and running.

## Building the Docker Image

To build the Docker image for the AWS MCP Server, navigate to the root directory of the project (where the `Dockerfile` is located) and run the following command:

```bash
docker build -t aws-mcp-server .
```

This command will build an image tagged `aws-mcp-server`.

## Running the Docker Container

To run the Docker container, you need to provide your AWS credentials and the desired AWS region as environment variables. The server uses these to interact with your AWS account.

**Required Environment Variables:**

*   `AWS_ACCESS_KEY_ID`: Your AWS access key ID.
*   `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key.
*   `AWS_DEFAULT_REGION`: The default AWS region the server should operate in (e.g., `us-east-1`, `ca-central-1`).

**Optional Environment Variable for AWS:**

*   `AWS_SESSION_TOKEN`: If you are using temporary AWS credentials, provide the session token here.

**Optional Server Port:**

*   `PORT`: The port on which the server will listen. Defaults to `3000` if not set.

**Example `docker run` command:**

```bash
docker run -d \
  -e AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY" \
  -e AWS_DEFAULT_REGION="YOUR_AWS_DEFAULT_REGION" \
  # -e AWS_SESSION_TOKEN="YOUR_SESSION_TOKEN" # Uncomment if using temporary credentials
  # -e PORT="8080" # Uncomment to change the default port
  -p 3000:3000 \
  --name mcp-server \
  aws-mcp-server
```

*   `-d`: Runs the container in detached mode (in the background).
*   `-e VARIABLE="VALUE"`: Sets environment variables.
*   `-p 3000:3000`: Maps port 3000 on your host to port 3000 in the container. If you set a custom `PORT` environment variable, adjust the container port accordingly (e.g., `-p YOUR_HOST_PORT:$PORT`).
*   `--name mcp-server`: Assigns a name to the running container for easier management.
*   `aws-mcp-server`: The name of the image to run.

## Using the Server

### Discovering Tools

The server dynamically creates API endpoints based on the tools found in the `tools/` directory. To discover all available tool routes, you can send a GET request to the `/routes` endpoint:

```bash
curl http://localhost:3000/routes
```

This will return a JSON array of available paths and their methods.

### Calling a Tool

All tool functionalities are exposed via `POST` requests. The endpoint path structure is `/tools/{serviceName}/{toolName}`.

*   `{serviceName}`: Derived from the tool's filename (e.g., `EC2Tools.js` becomes `ec2`).
*   `{toolName}`: The name of the class representing the tool (e.g., `ListBuckets`).

The request body should be a JSON object containing the parameters required by the specific tool. Most tools require a `region` parameter if `AWS_DEFAULT_REGION` is not sufficient or if you need to target a different region for that specific call.

**Example: Listing S3 Buckets**

This tool typically doesn't require parameters beyond what's configured via environment variables for the client, but if you need to specify a region per-call:

```bash
curl -X POST http://localhost:3000/tools/s3/ListBuckets \
  -H "Content-Type: application/json" \
  -d '{
        "region": "us-east-1"
      }'
```
_(Note: The `ListBuckets` command in S3 is global and doesn't strictly need a region for the API call itself, but the client might be initialized with a region. The refactored tools take `region` as an argument to initialize the client for that specific call.)_

**Example: Describing EC2 Instances**

To describe specific EC2 instances:

```bash
curl -X POST http://localhost:3000/tools/ec2/DescribeInstances \
  -H "Content-Type: application/json" \
  -d '{
        "region": "us-east-1",
        "instanceIds": ["i-xxxxxxxxxxxxxxxxx", "i-yyyyyyyyyyyyyyyyy"]
      }'
```

If `instanceIds` is omitted, it may describe all instances (behavior depends on the tool's implementation and AWS SDK defaults).

## Available Toolsets (AWS Services)

The server provides tools for interacting with the following AWS services:

*   CloudWatch Logs (`cloudwatchlogs`)
*   CloudTrail (`cloudtrail` or `clouttrail` - based on actual filename)
*   Config Service (`configservice`)
*   EC2 (`ec2`)
*   ECS (`ecs`)
*   GuardDuty (`guardduty`)
*   AWS Health (`healthclient`)
*   IAM (`iam`)
*   Lambda (`lambda`)
*   Route 53 (`route53`)
*   S3 (`s3`)
*   SSM (Systems Manager) (`ssm`)

The exact `serviceName` in the URL path will correspond to the lowercase version of the filename (e.g., `EC2Tools.js` -> `ec2`).

## Environment Variables

The server relies on the following environment variables for configuration:

**Required for AWS Authentication:**

*   `AWS_ACCESS_KEY_ID`: Your AWS Access Key ID.
*   `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Access Key.
*   `AWS_DEFAULT_REGION`: The default AWS region for SDK clients (e.g., `us-east-1`).

**Optional for AWS Authentication:**

*   `AWS_SESSION_TOKEN`: Required if using temporary credentials (e.g., from an IAM role assumption).

**Optional for Server Configuration:**

*   `PORT`: The port on which the Express server will listen. Defaults to `3000`.

Refer to the `.env.example` file in the repository for a template. When running with Docker, these are passed using the `-e` flag. If running locally (e.g., `node index.js`), you can create a `.env` file.
