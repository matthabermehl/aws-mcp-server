# Contributing to AWS MCP Server

Thank you for your interest in contributing to the AWS MCP Server! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/aws-mcp-server.git
   cd aws-mcp-server
   ```
3. **Set up development environment**:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

## Development Workflow

### Running Locally

```bash
# Start the server
npm start

# Or with Docker
docker-compose up -d
```

### Testing Changes

```bash
# Test basic functionality
curl http://localhost:3000/routes

# Test specific tool
curl -X POST http://localhost:3000/tools/s3/ListBuckets \
  -H "Content-Type: application/json" \
  -d '{"region": "us-east-1"}'
```

## Adding New AWS Tools

### 1. Create Tool Class

Create a new file in the `tools/` directory following the existing pattern:

```javascript
// tools/YourServiceTools.js
class YourNewTool {
    constructor() {
        this.name = 'YourNewTool';
        this.description = 'Description of what this tool does';
    }

    async execute(params) {
        // Validate required parameters
        if (!params.region) {
            throw new Error('Region is required');
        }

        // Initialize AWS client
        const client = new YourAWSClient({ region: params.region });
        
        // Execute AWS operation
        const result = await client.yourOperation(params);
        return result;
    }
}

module.exports = { YourNewTool };
```

### 2. Export in Service Module

Add your tool to the appropriate service module or create a new one:

```javascript
// tools/YourServiceTools.js
const { YourNewTool, AnotherTool } = require('./YourServiceTools');

module.exports = {
    YourNewTool,
    AnotherTool
};
```

### 3. Test Your Tool

```bash
# Restart server
npm start

# Test new tool
curl -X POST http://localhost:3000/tools/yourservice/YourNewTool \
  -H "Content-Type: application/json" \
  -d '{"region": "us-east-1", "yourParam": "value"}'
```

## Code Style Guidelines

- Use **camelCase** for variable and function names
- Use **PascalCase** for class names
- Include **JSDoc comments** for public methods
- Follow **existing error handling patterns**
- Validate **required parameters** in each tool

## Submitting Changes

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow the coding standards
- Add tests if applicable
- Update documentation

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add YourNewTool for YourService"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring

### 4. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub with:
- Clear description of changes
- Reference to any related issues
- Testing instructions

## Documentation

When adding new tools or features:

1. **Update README.md** if adding new services
2. **Add examples** to DEPLOYMENT.md if relevant
3. **Document parameters** in tool descriptions
4. **Include usage examples** in pull request

## Issues and Bug Reports

When reporting issues:

1. **Use issue templates** if available
2. **Include environment details**:
   - Node.js version
   - Docker version
   - AWS region
   - Error messages
3. **Provide reproduction steps**
4. **Include relevant logs**

## Security Considerations

- **Never commit** AWS credentials or secrets
- **Use IAM roles** instead of access keys when possible
- **Follow AWS security best practices**
- **Report security issues** privately to maintainers

## Questions?

- Check existing **issues** and **discussions**
- Review the **README** and **DEPLOYMENT** guides
- Ask questions in **GitHub Discussions**

Thank you for contributing! 