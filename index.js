import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// Load environment variables from .env file if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Enhanced CORS and middleware
app.use((req, res, next) => {
    // Log all incoming requests
    logger.info(`Incoming ${req.method} request to ${req.path}`, {
        headers: req.headers,
        query: req.query,
        body: req.method === 'POST' ? req.body : undefined
    });
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, Cache-Control');
    res.header('Access-Control-Expose-Headers', 'Content-Type');
    
    // Explicitly disable compression (common n8n MCP issue)
    res.header('Content-Encoding', 'identity');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
});

// Disable compression middleware
app.set('trust proxy', false);
app.disable('x-powered-by');

app.use(express.json({ limit: '10mb' }));

// Store active SSE connections and sessions
const sseConnections = new Map();
const sessions = new Map();
let availableTools = {};

// MCP Protocol Implementation
const MCP_VERSION = "2024-11-05";

// Function to dynamically load tool schemas
async function loadToolSchemas() {
    const toolsDir = path.join(__dirname, 'tools');
    availableTools = {}; // Reset
    try {
        const files = await fs.readdir(toolsDir);
        const toolFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));

        for (const file of toolFiles) {
            const modulePath = `./${path.join('tools', file)}`.replace(/\\/g, '/');
            const serviceName = file.replace('Tools.js', '').toLowerCase();

            try {
                const toolModule = await import(modulePath);
                
                // Look for the tools collection (e.g., ec2Tools, ssmTools, etc.)
                const expectedCollectionName = `${serviceName}Tools`;
                let toolsCollection = null;
                
                if (toolModule[expectedCollectionName]) {
                    toolsCollection = toolModule[expectedCollectionName];
                } else if (toolModule.default) {
                    toolsCollection = toolModule.default;
                } else {
                    // Fallback: try to find any object that contains tool classes
                    for (const [key, value] of Object.entries(toolModule)) {
                        if (typeof value === 'object' && value !== null && !key.startsWith('_')) {
                            toolsCollection = value;
                            break;
                        }
                    }
                }

                if (!toolsCollection) {
                    logger.warn(`No tools collection found in ${file}`);
                    continue;
                }

                // Process each tool in the collection
                let toolCount = 0;
                for (const [toolName, ToolClass] of Object.entries(toolsCollection)) {
                    if (typeof ToolClass === 'function') {
                        try {
                            // Create an instance to get the schema
                            const toolInstance = new ToolClass();
                            
                            if (toolInstance.name && toolInstance.description && toolInstance.parameters) {
                                const fullToolName = `${serviceName}/${toolInstance.name}`;
                                availableTools[fullToolName] = {
                                    name: fullToolName,
                                    description: toolInstance.description,
                                    inputSchema: toolInstance.parameters
                                };
                                toolCount++;
                            } else {
                                logger.warn(`Tool ${toolName} in ${file} missing required properties (name, description, parameters)`);
                            }
                        } catch (error) {
                            logger.error(`Error instantiating tool ${toolName} from ${file}:`, error.message);
                        }
                    }
                }
                
                if (toolCount > 0) {
                    logger.info(`Loaded ${toolCount} tools from ${file}`);
                } else {
                    logger.warn(`No valid tools found in ${file}`);
                }
                
            } catch (error) {
                logger.error(`Error loading ${file}:`, error.message);
            }
        }

        const totalTools = Object.keys(availableTools).length;
        logger.info(`Total tools loaded: ${totalTools}`);
    } catch (error) {
        logger.error('Error loading tool schemas:', error);
    }
}

// Generate session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Send SSE message
function sendSseMessage(res, data) {
    if (res && !res.writableEnded) {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        res.write(message);
        return true;
    }
    return false;
}

// Handle MCP JSON-RPC requests
async function handleMcpRequest(request, sessionId) {
    const { jsonrpc, id, method, params } = request;

    // Validate JSON-RPC format
    if (jsonrpc !== "2.0") {
        return {
            jsonrpc: "2.0",
            id,
            error: {
                code: -32600,
                message: "Invalid Request",
                data: "jsonrpc must be '2.0'"
            }
        };
    }

    try {
        switch (method) {
            case 'initialize':
                // Store session info
                sessions.set(sessionId, {
                    initialized: true,
                    clientInfo: params?.clientInfo || {}
                });
                
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        protocolVersion: MCP_VERSION,
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {},
                            logging: {}
                        },
                        serverInfo: {
                            name: "aws-mcp-server",
                            version: "1.0.0"
                        }
                    }
                };

            case 'notifications/initialized':
                // Client has finished initialization
                logger.info(`Client ${sessionId} initialization completed`);
                return null; // No response needed for notifications

            case 'tools/list':
                const tools = Object.values(availableTools).map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                }));
                
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        tools
                    }
                };

            case 'tools/call':
                const { name: toolName, arguments: toolArgs } = params;
                
                if (!availableTools[toolName]) {
                    return {
                        jsonrpc: "2.0",
                        id,
                        error: {
                            code: -32602,
                            message: "Invalid params",
                            data: `Tool '${toolName}' not found`
                        }
                    };
                }

                try {
                    // Execute the tool
                    const result = await executeAwsTool(toolName, toolArgs);
                    
                    return {
                        jsonrpc: "2.0",
                        id,
                        result: {
                            content: [
                                {
                                    type: "text",
                                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                                }
                            ]
                        }
                    };
                } catch (error) {
                    logger.error(`Error executing tool ${toolName}:`, error);
                    return {
                        jsonrpc: "2.0",
                        id,
                        error: {
                            code: -32603,
                            message: "Internal error",
                            data: error.message
                        }
                    };
                }

            case 'resources/list':
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        resources: []
                    }
                };

            case 'prompts/list':
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        prompts: []
                    }
                };

            default:
                return {
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: -32601,
                        message: "Method not found",
                        data: `Method '${method}' is not supported`
                    }
                };
        }
    } catch (error) {
        logger.error(`Error handling method ${method}:`, error);
        return {
            jsonrpc: "2.0",
            id,
            error: {
                code: -32603,
                message: "Internal error",
                data: error.message
            }
        };
    }
}

// Execute AWS tool
async function executeAwsTool(toolName, args) {
    const [serviceName, operationName] = toolName.split('/');
    
    try {
        const toolsDir = path.join(__dirname, 'tools');
        const toolFile = `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Tools.js`;
        const modulePath = `./${path.join('tools', toolFile)}`.replace(/\\/g, '/');
        
        const toolModule = await import(modulePath);
        
        // Look for the tools collection
        const expectedCollectionName = `${serviceName}Tools`;
        let toolsCollection = null;
        
        if (toolModule[expectedCollectionName]) {
            toolsCollection = toolModule[expectedCollectionName];
        } else if (toolModule.default) {
            toolsCollection = toolModule.default;
        } else {
            // Fallback: try to find any object that contains tool classes
            for (const [key, value] of Object.entries(toolModule)) {
                if (typeof value === 'object' && value !== null && !key.startsWith('_')) {
                    toolsCollection = value;
                    break;
                }
            }
        }
        
        if (!toolsCollection) {
            throw new Error(`No tools collection found in ${toolFile}`);
        }
        
        // Find the tool class by operation name
        const ToolClass = toolsCollection[operationName];
        if (!ToolClass || typeof ToolClass !== 'function') {
            throw new Error(`Tool class ${operationName} not found in ${toolFile}`);
        }
        
        // Create an instance and call it
        const toolInstance = new ToolClass();
        
        // Generate a unique ID for this call
        const callId = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Call the tool with the expected parameters
        const result = await toolInstance.call(callId, args);
        return result;
        
    } catch (error) {
        logger.error(`Error executing AWS tool ${toolName}:`, error);
        throw error;
    }
}

// SSE endpoint for MCP transport
app.get('/sse', (req, res) => {
    const sessionId = generateSessionId();
    logger.info(`MCP SSE client connected with session: ${sessionId}`);
    
    // Set SSE headers with proper CORS
    res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Type',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Encoding': 'identity',
        'X-Accel-Buffering': 'no'
    });
    
    // Store connection
    sseConnections.set(sessionId, res);
    
    // Send initial endpoint event (required by MCP SSE spec)
    const endpointEvent = {
        type: "endpoint",
        uri: "/messages"
    };
    
    if (!sendSseMessage(res, endpointEvent)) {
        logger.error('Failed to send initial endpoint event');
        sseConnections.delete(sessionId);
        return;
    }
    
    logger.info(`Sent endpoint event for session ${sessionId}: ${JSON.stringify(endpointEvent)}`);
    
    // Store session ID for this response object so we can retrieve it later
    res.sessionId = sessionId;
    
    // Handle client disconnect
    req.on('close', () => {
        logger.info(`MCP SSE client disconnected: ${sessionId}`);
        sseConnections.delete(sessionId);
        sessions.delete(sessionId);
    });
    
    req.on('error', (error) => {
        logger.error(`SSE connection error for ${sessionId}:`, error);
        sseConnections.delete(sessionId);
        sessions.delete(sessionId);
    });
    
    // Keep connection alive
    const keepAlive = setInterval(() => {
        if (!sendSseMessage(res, { type: "ping", timestamp: Date.now() })) {
            clearInterval(keepAlive);
        }
    }, 30000); // Send ping every 30 seconds
    
    req.on('close', () => {
        clearInterval(keepAlive);
    });
});

// Messages endpoint for MCP JSON-RPC
app.post('/messages', async (req, res) => {
    try {
        let sessionId = req.query.session || req.headers['x-session-id'] || req.headers['session-id'];
        const request = req.body;
        
        // If no session ID provided, try to find an active session
        // This is a fallback for clients that don't send session IDs
        if (!sessionId && sseConnections.size > 0) {
            // Use the most recent session as fallback
            sessionId = Array.from(sseConnections.keys()).pop();
            logger.info(`No session ID provided, using fallback session: ${sessionId}`);
        }
        
        if (!sessionId) {
            logger.error('No session ID provided and no active sessions found');
            return res.status(400).json({
                jsonrpc: "2.0",
                id: request?.id || null,
                error: {
                    code: -32600,
                    message: "Invalid Request",
                    data: "Session ID required or no active sessions"
                }
            });
        }
        
        logger.info(`Received MCP request for session ${sessionId}:`, JSON.stringify(request, null, 2));
        
        const response = await handleMcpRequest(request, sessionId);
        
        if (response) {
            logger.info(`Sending MCP response for session ${sessionId}:`, JSON.stringify(response, null, 2));
            
            // Send response via SSE to the specific client
            const sseConnection = sseConnections.get(sessionId);
            if (sseConnection) {
                sendSseMessage(sseConnection, response);
            }
            
            // Also send HTTP response
            res.json(response);
        } else {
            // For notifications, just acknowledge
            res.status(204).send();
        }
    } catch (error) {
        logger.error('Error processing MCP request:', error);
        
        const errorResponse = {
            jsonrpc: "2.0",
            id: req.body?.id || null,
            error: {
                code: -32603,
                message: "Internal error",
                data: error.message
            }
        };
        
        res.status(500).json(errorResponse);
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'AWS MCP Server is running',
        version: '1.0.0',
        protocol: MCP_VERSION,
        endpoints: {
            sse: '/sse',
            messages: '/messages'
        },
        toolsLoaded: Object.keys(availableTools).length,
        activeSessions: sseConnections.size
    });
});

// Routes endpoint for debugging
app.get('/routes', (req, res) => {
    res.json({
        routes: [
            'GET /',
            'GET /sse',
            'POST /messages',
            'GET /routes'
        ],
        activeSessions: Array.from(sseConnections.keys()),
        totalTools: Object.keys(availableTools).length
    });
});

// Start server
async function startServer() {
    try {
        await loadToolSchemas();
        
        app.listen(port, () => {
            logger.info(`AWS MCP Server listening on port ${port}`);
            logger.info(`SSE endpoint: http://localhost:${port}/sse`);
            logger.info(`Messages endpoint: http://localhost:${port}/messages`);
            logger.info(`Tools loaded: ${Object.keys(availableTools).length}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
