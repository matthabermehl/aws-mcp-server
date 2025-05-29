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
const streamConnections = new Map();
const sessions = new Map();
let availableTools = {};

// MCP Protocol Implementation
const MCP_VERSION = "2025-03-26";

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
                
                // Look for the tools collection
                const expectedCollectionName = `${serviceName}Tools`;
                let toolsCollection = null;
                
                logger.info(`Looking for tools collection: ${expectedCollectionName}`);
                logger.info(`Available exports:`, Object.keys(toolModule));
                
                if (toolModule[expectedCollectionName]) {
                    toolsCollection = toolModule[expectedCollectionName];
                    logger.info(`Found tools collection: ${expectedCollectionName}`);
                } else if (toolModule.default) {
                    toolsCollection = toolModule.default;
                    logger.info(`Using default export as tools collection`);
                } else {
                    // Fallback: try to find any object that contains tool classes
                    for (const [key, value] of Object.entries(toolModule)) {
                        if (typeof value === 'object' && value !== null && !key.startsWith('_')) {
                            toolsCollection = value;
                            logger.info(`Using fallback tools collection: ${key}`);
                            break;
                        }
                    }
                }
                
                if (!toolsCollection) {
                    throw new Error(`No tools collection found in ${file}. Available exports: ${Object.keys(toolModule).join(', ')}`);
                }
                
                logger.info(`Tools in collection:`, Object.keys(toolsCollection));
                
                // Process each tool in the collection
                let toolCount = 0;
                for (const [toolName, ToolClass] of Object.entries(toolsCollection)) {
                    if (typeof ToolClass === 'function') {
                        try {
                            // Create an instance to get the schema
                            const toolInstance = new ToolClass();
                            
                            if (toolInstance.name && toolInstance.description && toolInstance.parameters) {
                                const fullToolName = `${serviceName}_${toolInstance.name}`;
                                // Store the actual tool instance, not just metadata
                                availableTools[fullToolName] = toolInstance;
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
        // Ensure availableTools is always a valid object, even if loading fails
        if (!availableTools || typeof availableTools !== 'object') {
            availableTools = {};
        }
    }
    
    // Final safety check to ensure availableTools is always valid
    if (!availableTools || typeof availableTools !== 'object') {
        logger.warn('availableTools was not properly initialized, setting to empty object');
        availableTools = {};
    }
}

// Generate session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Send SSE message
function sendSseMessage(res, data) {
    if (res && !res.writableEnded) {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            return true;
        } catch (e) {
            logger.error(`Error writing to SSE stream for session ${res.sessionId}:`, e);
            return false;
        }
    }
    return false;
}

// Send HTTP Streamable message (NDJSON)
function sendStreamableMessage(res, data) {
    if (res && !res.writableEnded) {
        try {
            res.write(JSON.stringify(data) + '\\n');
            return true;
        } catch (e) {
            logger.error(`Error writing to Streamable stream for session ${res.sessionId}:`, e);
            return false;
        }
    }
    return false;
}

// Handle MCP JSON-RPC requests
async function handleMcpRequest(request, sessionId, clientType = null, connection = null) {
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
                            tools: {
                                listChanged: true
                            },
                            resources: {
                                subscribe: false,
                                listChanged: false
                            },
                            prompts: {
                                listChanged: false
                            },
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
                logger.info(`🎉 Client ${sessionId} initialization completed - MCP handshake successful!`);
                logger.info(`Client info:`, sessions.get(sessionId)?.clientInfo);
                logger.info(`Available tools: ${Object.keys(availableTools).length}`);
                
                // No welcome message needed - this was causing malformed SSE data
                // The MCP protocol doesn't require a welcome message after initialization
                
                return null; // No response needed for notifications

            case 'notifications/cancelled':
                // Client has cancelled a request
                const { requestId, reason } = params;
                logger.info(`Request ${requestId} was cancelled by client ${sessionId}. Reason: ${reason}`);
                
                // TODO: If we were tracking ongoing requests, we would cancel them here
                // For now, just log the cancellation
                
                return null; // No response needed for notifications

            case 'notifications/progress':
                // Client is reporting progress (not typically used by clients, but good to handle)
                logger.info(`Progress notification from client ${sessionId}:`, params);
                return null; // No response needed for notifications

            case 'notifications/message':
                // Client is sending a message notification
                logger.info(`Message notification from client ${sessionId}:`, params);
                return null; // No response needed for notifications

            case 'tools/list':
                logger.info(`Tools list requested for session ${sessionId}`);
                
                // Ensure availableTools is defined and create a safe tools array
                const safeAvailableTools = availableTools || {};
                const toolsArray = [];
                
                try {
                    for (const [name, toolInstance] of Object.entries(safeAvailableTools)) {
                        // Validate that the tool instance has required properties
                        if (toolInstance && 
                            typeof toolInstance.name === 'string' && 
                            typeof toolInstance.description === 'string' && 
                            toolInstance.parameters) {
                            
                            toolsArray.push({
                                name: name,
                                description: toolInstance.description,
                                inputSchema: toolInstance.parameters
                            });
                        } else {
                            logger.warn(`Skipping invalid tool instance: ${name}`, {
                                hasName: !!toolInstance?.name,
                                hasDescription: !!toolInstance?.description,
                                hasParameters: !!toolInstance?.parameters
                            });
                        }
                    }
                } catch (error) {
                    logger.error(`Error building tools list:`, error);
                    // Continue with empty array rather than failing
                }
                
                logger.info(`Returning ${toolsArray.length} tools in tools/list response`);
                
                return {
                    jsonrpc: "2.0",
                    id,
                    result: {
                        tools: toolsArray
                    }
                };

            case 'tools/call':
                const requestStartTime = Date.now();
                logger.info(`[TIMING] Tool call started at ${new Date().toISOString()}`);
                
                const { name, arguments: args } = params;
                logger.info(`Tool call request: ${name} with args:`, args);
                
                if (!availableTools[name]) {
                    const error = { code: -32601, message: `Tool not found: ${name}` };
                    logger.error(`Tool not found: ${name}`);
                    return {
                        jsonrpc: '2.0',
                        id,
                        error
                    };
                }

                try {
                    const toolStartTime = Date.now();
                    logger.info(`[TIMING] Tool execution started at ${new Date().toISOString()}`);
                    
                    const result = await availableTools[name].call(id, args, {}, null, null);
                    
                    const toolEndTime = Date.now();
                    logger.info(`[TIMING] Tool execution completed in ${toolEndTime - toolStartTime}ms`);
                    logger.info(`Tool execution completed successfully, result type: ${typeof result}`);
                    logger.info(`Tool execution completed successfully for: ${name}`);
                    logger.info(`Tool result type: ${typeof result}, size: ${JSON.stringify(result).length} characters`);

                    const response = {
                        jsonrpc: '2.0',
                        id,
                        result: {
                            content: [
                                {
                                    type: 'text',
                                    text: typeof result === 'string' ? result : JSON.stringify(result)
                                }
                            ]
                        }
                    };

                    const responseStartTime = Date.now();
                    logger.info(`[TIMING] Response preparation started at ${new Date().toISOString()}`);
                    logger.info(`MCP response prepared, size: ${JSON.stringify(response).length} characters`);
                    
                    const totalTime = Date.now() - requestStartTime;
                    logger.info(`[TIMING] Total request processing time: ${totalTime}ms`);
                    
                    return response;
                    
                } catch (error) {
                    logger.error(`Tool execution error for ${name}:`, error);
                    const errorResponse = { code: -32603, message: `Tool execution failed: ${error.message}` };
                    return {
                        jsonrpc: '2.0',
                        id,
                        error: errorResponse
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
    const [serviceName, operationName] = toolName.split('_');
    
    logger.info(`Executing AWS tool: ${toolName} (service: ${serviceName}, operation: ${operationName})`);
    
    try {
        const toolsDir = path.join(__dirname, 'tools');
        
        // Handle special cases for AWS service name capitalization
        let capitalizedServiceName;
        switch (serviceName.toLowerCase()) {
            case 'ec2':
                capitalizedServiceName = 'EC2';
                break;
            case 'ecs':
                capitalizedServiceName = 'ECS';
                break;
            case 'iam':
                capitalizedServiceName = 'Iam';
                break;
            case 's3':
                capitalizedServiceName = 'S3';
                break;
            case 'ssm':
                capitalizedServiceName = 'Ssm';
                break;
            case 'route53':
                capitalizedServiceName = 'Route53';
                break;
            case 'lambda':
                capitalizedServiceName = 'Lambda';
                break;
            case 'guardduty':
                capitalizedServiceName = 'Guardduty';
                break;
            case 'cloudwatchlogs':
                capitalizedServiceName = 'CloudwatchLogs';
                break;
            case 'clouttrail':
                capitalizedServiceName = 'CloutTrail';
                break;
            case 'configservice':
                capitalizedServiceName = 'ConfigService';
                break;
            case 'healthclient':
                capitalizedServiceName = 'HealthClient';
                break;
            default:
                capitalizedServiceName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
        }
        
        const toolFile = `${capitalizedServiceName}Tools.js`;
        const modulePath = `./${path.join('tools', toolFile)}`.replace(/\\/g, '/');
        
        logger.info(`Loading tool module: ${modulePath}`);
        
        const toolModule = await import(modulePath);
        
        // Look for the tools collection
        const expectedCollectionName = `${serviceName}Tools`;
        let toolsCollection = null;
        
        logger.info(`Looking for tools collection: ${expectedCollectionName}`);
        logger.info(`Available exports:`, Object.keys(toolModule));
        
        if (toolModule[expectedCollectionName]) {
            toolsCollection = toolModule[expectedCollectionName];
            logger.info(`Found tools collection: ${expectedCollectionName}`);
        } else if (toolModule.default) {
            toolsCollection = toolModule.default;
            logger.info(`Using default export as tools collection`);
        } else {
            // Fallback: try to find any object that contains tool classes
            for (const [key, value] of Object.entries(toolModule)) {
                if (typeof value === 'object' && value !== null && !key.startsWith('_')) {
                    toolsCollection = value;
                    logger.info(`Using fallback tools collection: ${key}`);
                    break;
                }
            }
        }
        
        if (!toolsCollection) {
            throw new Error(`No tools collection found in ${toolFile}. Available exports: ${Object.keys(toolModule).join(', ')}`);
        }
        
        logger.info(`Tools in collection:`, Object.keys(toolsCollection));
        
        // Find the tool class by operation name
        const ToolClass = toolsCollection[operationName];
        if (!ToolClass || typeof ToolClass !== 'function') {
            throw new Error(`Tool class ${operationName} not found in ${toolFile}. Available tools: ${Object.keys(toolsCollection).join(', ')}`);
        }
        
        logger.info(`Creating instance of tool class: ${operationName}`);
        
        // Create an instance and call it
        const toolInstance = new ToolClass();
        
        // Generate a unique ID for this call
        const callId = `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        logger.info(`Calling tool with ID: ${callId} and args:`, args);
        
        // Validate args against tool schema if needed
        logger.info(`Tool schema:`, toolInstance.parameters);
        
        // Call the tool with the expected parameters
        const result = await toolInstance.call(callId, args);
        
        logger.info(`Tool execution completed successfully, result type: ${typeof result}`);
        
        return result;
        
    } catch (error) {
        logger.error(`Error executing AWS tool ${toolName}:`, error);
        logger.error(`Error stack:`, error.stack);
        throw error;
    }
}

// SSE endpoint for MCP transport
app.get('/sse', (req, res) => {
    const sessionId = generateSessionId();
    res.sessionId = sessionId; // Assign sessionId to res early for logging in sendSseMessage
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
        'X-Accel-Buffering': 'no'
    });

    // Store connection
    sseConnections.set(sessionId, res);
    
    // Send initial endpoint event (required by MCP SSE spec)
    // Include session ID in the endpoint URL as per MCP SSE specification
    const endpointUri = `/messages/?session_id=${sessionId}`;
    
    logger.info(`Attempting to send initial SSE event for session ${sessionId}: ${endpointUri}`);
    
    // Send as a proper SSE event with event type
    if (res && !res.writableEnded) {
        try {
            res.write(`event: endpoint\n`);
            res.write(`data: ${endpointUri}\n`);
            res.write(`id: ${sessionId}\n\n`);
            logger.info(`Successfully sent endpoint event for session ${sessionId}: ${endpointUri}`);
        } catch (e) {
            logger.error(`Failed to send initial endpoint event for SSE session ${sessionId}:`, e);
            sseConnections.delete(sessionId);
            if (!res.writableEnded) res.end();
            return;
        }
    } else {
        logger.error(`Failed to send initial endpoint event for SSE session ${sessionId} - response not writable`);
        sseConnections.delete(sessionId);
        if (!res.writableEnded) res.end();
        return;
    }
    
    // Send a follow-up ping to test connection stability
    setTimeout(() => {
        if (sseConnections.has(sessionId)) {
            const pingEvent = { type: "ping", timestamp: Date.now() };
            if (sendSseMessage(res, pingEvent)) {
                logger.info(`Sent ping to session ${sessionId}`);
            } else {
                logger.warn(`Failed to send ping to session ${sessionId} - connection may be closed`);
                sseConnections.delete(sessionId);
            }
        }
    }, 1000);
    
    // Handle client disconnect
    req.on('close', () => {
        logger.info(`MCP SSE client disconnected: ${sessionId}`);
        sseConnections.delete(sessionId);
    });

    req.on('error', (error) => {
        logger.error(`SSE connection error for ${sessionId}:`, error);
        sseConnections.delete(sessionId);
    });
});

// HTTP Streamable endpoint for MCP transport (replaces /stream)
app.all('/stream', (req, res) => {
    logger.info(`=== HTTP STREAMABLE REQUEST ===`);
    logger.info(`Method: ${req.method}`);
    logger.info(`Headers:`, req.headers);
    logger.info(`Query:`, req.query);
    logger.info(`Body:`, req.body);

    if (req.method === 'GET') {
        // GET request - establish SSE stream for server-to-client messages
        const sessionId = generateSessionId();
        res.sessionId = sessionId;
        logger.info(`HTTP Streamable GET - establishing SSE stream with session: ${sessionId}`);

        res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Mcp-Session-Id, Last-Event-ID',
            'Access-Control-Expose-Headers': 'Content-Type, Mcp-Session-Id',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Encoding': 'identity',
            'X-Accel-Buffering': 'no',
            'Mcp-Session-Id': sessionId
        });

        streamConnections.set(sessionId, res);

        // Send initial endpoint event (required by MCP Streamable HTTP spec)
        const endpointEvent = {
            uri: "/stream"
        };

        if (!sendStreamableMessage(res, endpointEvent)) {
            logger.error(`Failed to send initial endpoint event for stream session ${sessionId}`);
            streamConnections.delete(sessionId);
            if (!res.writableEnded) res.end();
            return;
        }
        logger.info(`Sent endpoint event for stream session ${sessionId}: ${JSON.stringify(endpointEvent)}`);

        req.on('close', () => {
            logger.info(`HTTP Streamable GET client disconnected: ${sessionId}`);
            streamConnections.delete(sessionId);
            sessions.delete(sessionId);
        });

        req.on('error', (error) => {
            logger.error(`HTTP Streamable GET connection error for ${sessionId}:`, error);
            streamConnections.delete(sessionId);
            sessions.delete(sessionId);
            if (!res.writableEnded) res.end();
        });

        // Keep connection alive with pings
        const keepAlive = setInterval(() => {
            if (!sendStreamableMessage(res, { type: "ping", timestamp: Date.now() })) {
                logger.warn(`HTTP Streamable GET sendStreamableMessage failed for session ${sessionId}, closing connection.`);
                clearInterval(keepAlive);
                streamConnections.delete(sessionId);
                sessions.delete(sessionId);
                if (!res.writableEnded) res.end();
            }
        }, 30000);

        req.on('close', () => clearInterval(keepAlive));
        req.on('error', () => clearInterval(keepAlive));

    } else if (req.method === 'POST') {
        // POST request - handle JSON-RPC messages
        handleStreamablePost(req, res);
    } else if (req.method === 'DELETE') {
        // DELETE request - terminate session
        const sessionId = req.headers['mcp-session-id'];
        if (sessionId) {
            logger.info(`HTTP Streamable DELETE - terminating session: ${sessionId}`);
            if (streamConnections.has(sessionId)) {
                const connection = streamConnections.get(sessionId);
                streamConnections.delete(sessionId);
                if (!connection.writableEnded) connection.end();
            }
            sessions.delete(sessionId);
            res.status(200).json({ message: "Session terminated" });
        } else {
            res.status(400).json({ error: "No session ID provided" });
        }
    } else if (req.method === 'OPTIONS') {
        // OPTIONS request - CORS preflight
        res.status(200).end();
    } else {
        res.status(405).json({
            jsonrpc: "2.0",
            error: {
                code: -32000,
                message: "Method not allowed"
            },
            id: null
        });
    }
});

// Handle POST requests to the HTTP Streamable endpoint
async function handleStreamablePost(req, res) {
    try {
        const sessionId = req.headers['mcp-session-id'];
        const request = req.body;
        
        logger.info(`HTTP Streamable POST - Session ID: ${sessionId}`);
        logger.info(`HTTP Streamable POST - Request: ${request?.method || 'unknown method'}`);

        // Check if this is an initialization request
        if (request && request.method === 'initialize') {
            // For initialization, we can create a new session
            const newSessionId = generateSessionId();
            logger.info(`HTTP Streamable POST - Creating new session for initialization: ${newSessionId}`);
            
            const response = await handleMcpRequest(request, newSessionId);
            
            if (response) {
                logger.info(`HTTP Streamable POST - Sending initialization response with session ${newSessionId}`);
                res.set('Mcp-Session-Id', newSessionId);
                res.status(200).json(response);
            } else {
                res.status(204).send();
            }
            return;
        }

        // For non-initialization requests, require a session ID
        if (!sessionId) {
            logger.error('HTTP Streamable POST - No session ID provided for non-initialization request');
            return res.status(400).json({
                jsonrpc: "2.0",
                id: request?.id || null,
                error: {
                    code: -32600,
                    message: "Invalid Request",
                    data: "Session ID required for non-initialization requests"
                }
            });
        }

        // Check if session exists (for stateful servers)
        // For now, we'll be stateless and just process the request
        logger.info(`HTTP Streamable POST - Processing request for session ${sessionId}`);
        
        const response = await handleMcpRequest(request, sessionId);
        
        if (response) {
            // Reduced logging to avoid noise - only log response size and type
            const responseSize = JSON.stringify(response).length;
            const responseType = response.result ? 'success' : (response.error ? 'error' : 'notification');
            logger.info(`HTTP Streamable POST - Sending response: ${responseType}, ${responseSize} chars`);
            
            // Check Accept header to determine response format
            const acceptHeader = req.headers.accept || '';
            
            if (acceptHeader.includes('text/event-stream')) {
                // Client prefers SSE response
                logger.info(`HTTP Streamable POST - Client accepts SSE, sending as event stream`);
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Mcp-Session-Id',
                    'Access-Control-Expose-Headers': 'Content-Type, Mcp-Session-Id',
                    'Mcp-Session-Id': sessionId
                });
                
                // Send response as SSE event
                const responseStr = JSON.stringify(response);
                connection.write(`data: ${responseStr}\n\n`);
                res.end();
            } else {
                // Send as regular JSON response
                logger.info(`HTTP Streamable POST - Sending as JSON response`);
                res.set('Mcp-Session-Id', sessionId);
                res.status(200).json(response);
            }
        } else {
            // For notifications (null response)
            logger.info(`HTTP Streamable POST - No response needed (notification)`);
            res.set('Mcp-Session-Id', sessionId);
            res.status(202).send(); // 202 Accepted for notifications
        }
    } catch (error) {
        logger.error('Error processing HTTP Streamable POST request:', error);
        const errorId = req.body?.id || null;
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                id: errorId,
                error: {
                    code: -32603,
                    message: "Internal server error during HTTP Streamable POST processing",
                    data: error.message
                }
            });
        }
    }
}

// Messages endpoint for MCP JSON-RPC
app.post('/messages', async (req, res) => {
    logger.info(`=== INCOMING POST TO /messages ===`);
    logger.info(`Request headers:`, req.headers);
    logger.info(`Request body:`, req.body);
    
    try {
        // Extract session ID from query parameters (as sent in endpoint event)
        let sessionId = req.query.session_id || req.headers['x-session-id'] || req.headers['session-id'] || req.headers['last-event-id'];
        const request = req.body;
        let clientType = null;
        let connection = null;

        logger.info(`Session ID from request: ${sessionId}`);
        logger.info(`Active SSE connections: ${Array.from(sseConnections.keys())}`);
        logger.info(`Active Stream connections: ${Array.from(streamConnections.keys())}`);

        if (sessionId) {
            if (sseConnections.has(sessionId)) {
                clientType = 'sse';
                connection = sseConnections.get(sessionId);
                logger.info(`Found SSE connection for session ${sessionId}`);
            } else if (streamConnections.has(sessionId)) {
                clientType = 'stream';
                connection = streamConnections.get(sessionId);
                logger.info(`Found Stream connection for session ${sessionId}`);
            } else {
                logger.warn(`Session ID ${sessionId} provided but no matching connection found`);
            }
        }
        
        // Fallback for clients that don't send session IDs
        if (!sessionId) {
            logger.warn('No session ID provided in /messages request. Fallback to most recent active connection.');
            // This fallback is problematic if client uses /messages without an active streaming connection.
            // Prefer SSE if both types have active connections without ID.
            const lastSseKey = sseConnections.size > 0 ? Array.from(sseConnections.keys()).pop() : null;
            const lastStreamKey = streamConnections.size > 0 ? Array.from(streamConnections.keys()).pop() : null;

            if (lastSseKey) { // Prioritize SSE in ambiguous fallback
                sessionId = lastSseKey;
                clientType = 'sse';
                connection = sseConnections.get(sessionId);
                logger.info(`Fallback to SSE session: ${sessionId}`);
            } else if (lastStreamKey) {
                sessionId = lastStreamKey;
                clientType = 'stream';
                connection = streamConnections.get(sessionId);
                logger.info(`Fallback to Stream session: ${sessionId}`);
            }
        }
        
        if (!sessionId || !clientType || !connection) {
            logger.error('No session ID provided or session/connection not found for any transport for /messages.');
            logger.error(`Final state: sessionId=${sessionId}, clientType=${clientType}, connection=${!!connection}`);
            return res.status(400).json({
                jsonrpc: "2.0",
                id: request?.id || null,
                error: {
                    code: -32600,
                    message: "Invalid Request",
                    data: "Session ID required, or no active session found for provided ID, or ambiguous fallback."
                }
            });
        }
        
        logger.info(`Processing MCP request for session ${sessionId} (type: ${clientType}): ${request.method}`);
        
        const response = await handleMcpRequest(request, sessionId, clientType, connection);
        
        if (response) {
            // Reduced logging to avoid noise - only log response size and type
            const responseSize = JSON.stringify(response).length;
            const responseType = response.result ? 'success' : (response.error ? 'error' : 'notification');
            logger.info(`Generated MCP response for session ${sessionId} (type: ${clientType}): ${responseType}, ${responseSize} chars`);
            
            if (clientType === 'sse') {
                const sseStartTime = Date.now();
                logger.info(`[TIMING] SSE processing started at ${new Date().toISOString()}`);
                
                // For SSE transport, ALL responses (including tool calls) should go through the SSE stream
                logger.info(`Sending response via SSE for session ${sessionId}`);
                if (connection && !connection.writableEnded) {
                    try {
                        const responseStr = JSON.stringify(response);
                        connection.write(`data: ${responseStr}\n\n`);
                        
                        const sseEndTime = Date.now();
                        logger.info(`[TIMING] SSE response sent in ${sseEndTime - sseStartTime}ms`);
                        logger.info(`SSE response sent for session ${sessionId}`);
                    } catch (e) {
                        logger.error(`Failed to send SSE message event for session ${sessionId}:`, e);
                    }
                } else {
                    logger.error(`SSE connection not available or ended for session ${sessionId}`);
                }
                
                // Always return 202 Accepted for SSE transport (the actual response goes through SSE)
                res.status(202).send('Accepted');
                
            } else if (clientType === 'stream') {
                // For HTTP Streamable, typically the response to a POST on /messages
                // is sent directly as the HTTP response to that POST.
                // Asynchronous server-initiated messages (not direct replies) would go over the /stream connection.
                logger.info(`Sending direct HTTP response for stream session ${sessionId}`);
                res.status(200).json(response);
            }
        } else {
            // For notifications (null response from handleMcpRequest)
            logger.info(`No response needed for notification request from session ${sessionId}`);
            res.status(202).send('Accepted'); // Always 202 for SSE, even for notifications
        }
    } catch (error) {
        logger.error('Error processing MCP request in /messages:', error);
        const errorId = req.body?.id || null;
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: "2.0",
                id: errorId,
                error: {
                    code: -32603,
                    message: "Internal server error during /messages processing",
                    data: error.message
                }
            });
        }
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'AWS MCP Server is running',
        version: '1.0.0',
        protocol: MCP_VERSION,
        endpoints: {
            sse: '/sse (Server-Sent Events for n8n)',
            messages: '/messages (JSON-RPC)',
            tools: '/tools/{service}/{tool}',
            health: '/health (AWS connectivity test)'
        },
        transports: {
            'sse': '/sse (compatible with n8n MCP client)',
            'messages': '/messages (JSON-RPC endpoint)'
        },
        toolsLoaded: Object.keys(availableTools).length,
        activeSessions: {
            sse: sseConnections.size,
            stream: streamConnections.size
        },
        note: 'This server uses SSE transport for compatibility with n8n MCP client'
    });
});

// AWS connectivity health check
app.get('/health', async (req, res) => {
    try {
        // Test AWS connectivity with a simple STS call
        const { STSClient, GetCallerIdentityCommand } = await import('@aws-sdk/client-sts');
        
        const stsClient = new STSClient({
            region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
            maxAttempts: 1,
            requestTimeout: 5000
        });
        
        const command = new GetCallerIdentityCommand({});
        const result = await stsClient.send(command);
        
        res.json({
            status: 'healthy',
            aws: {
                connected: true,
                account: result.Account,
                arn: result.Arn,
                userId: result.UserId
            },
            toolsLoaded: Object.keys(availableTools).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('AWS health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            aws: {
                connected: false,
                error: error.message
            },
            toolsLoaded: Object.keys(availableTools).length,
            timestamp: new Date().toISOString()
        });
    }
});

// REST API endpoint for tools (for n8n integration)
app.post('/tools/:service/:tool', async (req, res) => {
    try {
        const { service, tool } = req.params;
        const args = req.body || {};
        
        logger.info(`REST API call to ${service}/${tool} with args:`, args);
        
        // Construct tool name in the format expected by executeAwsTool
        const toolName = `${service}_${tool}`;
        
        // Check if tool exists
        if (!availableTools[toolName]) {
            return res.status(404).json({
                error: 'Tool not found',
                message: `Tool ${toolName} is not available`,
                availableTools: Object.keys(availableTools)
            });
        }
        
        // Execute the tool
        const result = await executeAwsTool(toolName, args);
        
        logger.info(`REST API response for ${toolName}:`, result);
        res.json(result);
        
    } catch (error) {
        logger.error(`REST API error for ${req.params.service}/${req.params.tool}:`, error);
        res.status(500).json({
            error: 'Tool execution failed',
            message: error.message,
            tool: `${req.params.service}/${req.params.tool}`
        });
    }
});

// List available tools endpoint
app.get('/tools', (req, res) => {
    res.json({
        totalTools: Object.keys(availableTools).length,
        tools: availableTools
    });
});

// Routes endpoint for debugging
app.get('/routes', (req, res) => {
    res.json({
        routes: [
            'GET /',
            'GET /sse',
            'GET /stream',
            'POST /messages',
            'GET /tools',
            'POST /tools/{service}/{tool}',
            'GET /routes'
        ],
        activeSessions: Array.from(sseConnections.keys()),
        totalTools: Object.keys(availableTools).length
    });
});

// Start server
async function startServer() {
    await loadToolSchemas();
    app.listen(port, () => {
        logger.info(`AWS MCP Server listening on port ${port}`);
        logger.info(`SSE endpoint: http://localhost:${port}/sse`);
        logger.info(`Stream endpoint: http://localhost:${port}/stream`);
        logger.info(`Messages endpoint: http://localhost:${port}/messages`);
        logger.info(`Tools loaded: ${Object.keys(availableTools).length}`);
    });
}

startServer();
