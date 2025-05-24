import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js'; // MOVED TO TOP

// Load environment variables from .env file if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Function to dynamically load tools and create routes
async function setupToolsRoutes() {
    const toolsDir = path.join(__dirname, 'tools');
    try {
        const files = await fs.readdir(toolsDir);
        // Filter for .js files, excluding any potential map files or non-tool files
        const toolFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));

        for (const file of toolFiles) {
            // Construct module path relative to index.js, ensuring forward slashes for import()
            const modulePath = `./${path.join('tools', file)}`.replace(/\\/g, '/');
            // Derive serviceName from filename, e.g., EC2Tools.js -> ec2
            const serviceName = file.replace('Tools.js', '').toLowerCase(); 

            try {
                const toolModule = await import(modulePath);
                
                let toolsCollection = null;
                // The primary export in each tool file is an object like ec2Tools, s3Tools, etc.
                // This object is a named export.
                const expectedExportName = `${serviceName}Tools`; // e.g. s3Tools, ec2Tools
                
                if (toolModule[expectedExportName]) {
                    toolsCollection = toolModule[expectedExportName];
                } else if (toolModule.default && toolModule.default[expectedExportName]) {
                    // Fallback for modules that might default export an object containing the collection
                    toolsCollection = toolModule.default[expectedExportName];
                } else if (toolModule.default && typeof toolModule.default === 'object' && Object.keys(toolModule.default).length > 0) {
                    // Fallback for modules that might default export the collection directly (less likely with current structure)
                    // This is a more general fallback, check if the default export is the collection itself.
                    // A simple heuristic: if the default export is an object and has keys, it might be the tools collection.
                    // This might need refinement if module structures vary significantly.
                    const defaultExportKeys = Object.keys(toolModule.default);
                    if (defaultExportKeys.length > 0 && typeof toolModule.default[defaultExportKeys[0]] === 'function') {
                         toolsCollection = toolModule.default;
                    }
                }


                if (!toolsCollection) {
                    logger.warn(`No tools collection found in ${file} with expected export name '${expectedExportName}'. Skipping.`);
                    continue;
                }

                for (const toolName in toolsCollection) {
                    const ToolClass = toolsCollection[toolName];
                    if (typeof ToolClass !== 'function' || !ToolClass.prototype || !ToolClass.prototype.constructor) { 
                        logger.warn(`Export '${toolName}' in ${file} is not a class or class-like structure. Skipping.`);
                        continue;
                    }
                    
                    const endpointPath = `/tools/${serviceName}/${toolName}`;

                    app.post(endpointPath, async (req, res) => {
                        logger.info(`POST ${endpointPath} with body: ${JSON.stringify(req.body)}`);
                        try {
                            const toolInstance = new ToolClass();
                            const args = req.body;
                            const result = await toolInstance.call(`api-${serviceName}-${toolName}`, args);
                            res.json(result);
                        } catch (error) {
                            logger.error(`Error in ${endpointPath}: ${error.message}`, { stack: error.stack });
                            res.status(500).json({
                                error: error.message,
                                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                            });
                        }
                    });
                    console.log(`Registered endpoint: POST ${endpointPath}`); // Keep for startup visibility
                }
            } catch (err) {
                logger.error(`Error importing or processing module ${modulePath}: ${err.message}`, { stack: err.stack });
            }
        }
    } catch (err) {
        logger.error('Error reading tools directory or setting up routes:', { message: err.message, stack: err.stack });
    }
}

app.get('/', (req, res) => {
    res.send('AWS MCP Server is running! Check /routes for available tool endpoints.');
});

// Add a /routes endpoint to list all registered tool routes
app.get('/routes', (req, res) => {
    const routes = app._router.stack
        .filter(r => r.route && r.route.path && (r.route.methods.post || r.route.methods.get))
        .map(r => ({
            path: r.route.path,
            methods: Object.keys(r.route.methods).filter(method => method === 'post' || method === 'get').map(m => m.toUpperCase())
        }));
    res.json(routes);
});


// Start the server after setting up routes
async function startServer() {
    await setupToolsRoutes(); // Ensure routes are set up before listening
    app.listen(port, () => {
        logger.info(`MCP Server listening on port ${port}`);
        logger.info(`Access the list of tool routes at http://localhost:${port}/routes`);
    });
}

startServer();
