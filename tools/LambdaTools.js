import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    LambdaClient,
    GetAliasCommand,
    GetFunctionCommand,
    GetFunctionConfigurationCommand,
    GetFunctionUrlConfigCommand,
    GetLayerVersionCommand,
    GetLayerVersionPolicyCommand,
    GetPolicyCommand,
    ListAliasesCommand,
    ListFunctionsCommand,
    ListLayerVersionsCommand,
    ListLayersCommand,
    ListProvisionedConcurrencyConfigsCommand,
    ListTagsCommand,
    ListVersionsByFunctionCommand,
} from "@aws-sdk/client-lambda";

class LambdaTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const lambdaClient = this.getLambdaClient(region);
        try {
            const response = await lambdaClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Lambda command: ${error.message}`);
            throw error;
        }
    }

    getLambdaClient(region) {
        return new LambdaClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class GetAlias extends LambdaTool {
    constructor() {
        super('GetAlias', 'Returns details about a specified alias for an AWS Lambda function.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Name: {
                    type: 'string',
                    description: 'The name of the alias.'
                }
            },
            required: ['FunctionName', 'Name', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, Name } = args;
            
            const command = new GetAliasCommand({ FunctionName, Name });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda alias: ${error.message}`);
            throw error;
        }
    }
}

export class GetFunction extends LambdaTool {
    constructor() {
        super('GetFunction', 'Returns information about an AWS Lambda function or a specific version.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias to get details for (optional).'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, Qualifier } = args;
            
            const command = new GetFunctionCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function: ${error.message}`);
            throw error;
        }
    }
}

export class GetFunctionConfiguration extends LambdaTool {
    constructor() {
        super('GetFunctionConfiguration', 'Retrieves version-specific settings for an AWS Lambda function or a specific version.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias to get configuration for (optional).'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, Qualifier } = args;
            
            const command = new GetFunctionConfigurationCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function configuration: ${error.message}`);
            throw error;
        }
    }
}

export class GetFunctionUrlConfig extends LambdaTool {
    constructor() {
        super('GetFunctionUrlConfig', 'Fetches details of an AWS Lambda function URL.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName } = args;
            
            const command = new GetFunctionUrlConfigCommand({ FunctionName });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function URL config: ${error.message}`);
            throw error;
        }
    }
}

export class GetLayerVersion extends LambdaTool {
    constructor() {
        super('GetLayerVersion', 'Retrieves information about a specific version of an AWS Lambda layer.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                LayerName: {
                    type: 'string',
                    description: 'The name of the Lambda layer.'
                },
                VersionNumber: {
                    type: 'number',
                    description: 'The version number of the layer.'
                }
            },
            required: ['LayerName', 'VersionNumber', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, LayerName, VersionNumber } = args;
            
            const command = new GetLayerVersionCommand({ LayerName, VersionNumber });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda layer version: ${error.message}`);
            throw error;
        }
    }
}

export class GetLayerVersionPolicy extends LambdaTool {
    constructor() {
        super('GetLayerVersionPolicy', 'Retrieves the permission policy for a specified Lambda layer version.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                LayerName: {
                    type: 'string',
                    description: 'The name of the Lambda layer.'
                },
                VersionNumber: {
                    type: 'number',
                    description: 'The version number of the layer.'
                }
            },
            required: ['LayerName', 'VersionNumber', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, LayerName, VersionNumber } = args;
            
            const command = new GetLayerVersionPolicyCommand({ LayerName, VersionNumber });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda layer version policy: ${error.message}`);
            throw error;
        }
    }
}

export class GetLambdaFunctionPolicy extends LambdaTool {
    constructor() {
        super('GetLambdaFunctionPolicy', 'Returns the resource-based IAM policy for an AWS Lambda function, version, or alias.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias (optional).'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, Qualifier } = args;
            
            const command = new GetPolicyCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function policy: ${error.message}`);
            throw error;
        }
    }
}

export class ListAliases extends LambdaTool {
    constructor() {
        super('ListAliases', 'Returns a list of aliases for a specified AWS Lambda function.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                FunctionVersion: {
                    type: 'string',
                    description: 'Filter by function version (optional).'
                },
                Marker: {
                    type: 'string',
                    description: 'Pagination token for the next page of results (optional).'
                },
                MaxItems: {
                    type: 'number',
                    description: 'Maximum number of results to return (optional).'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, FunctionVersion, Marker, MaxItems } = args;
            
            const command = new ListAliasesCommand({ FunctionName, FunctionVersion, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda aliases: ${error.message}`);
            throw error;
        }
    }
}

export class ListFunctions extends LambdaTool {
    constructor() {
        super('ListFunctions', 'Lists AWS Lambda functions in the specified account and region.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionVersion: {
                    type: 'string',
                    description: "Set to 'ALL' to include all published versions of each function (optional)."
                },
                Marker: {
                    type: 'string',
                    description: 'Pagination token for the next page of results (optional).'
                },
                MaxItems: {
                    type: 'number',
                    description: 'Maximum number of results to return (optional).'
                }
            },
            required: ['region'] 
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionVersion, Marker, MaxItems } = args;
            
            const command = new ListFunctionsCommand({ FunctionVersion, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda functions: ${error.message}`);
            throw error;
        }
    }
}

export class ListLayers extends LambdaTool {
    constructor() {
        super('ListLayers', 'Lists available Lambda layers and their latest versions in the specified account and region.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                CompatibleRuntime: {
                    type: 'string',
                    description: 'Filter layers by compatible runtime (optional).'
                },
                CompatibleArchitecture: {
                    type: 'string',
                    description: 'Filter layers by compatible architecture (optional).'
                },
                Marker: {
                    type: 'string',
                    description: 'Pagination token for the next page of results (optional).'
                },
                MaxItems: {
                    type: 'number',
                    description: 'Maximum number of results to return (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, CompatibleRuntime, CompatibleArchitecture, Marker, MaxItems } = args;
            
            const command = new ListLayersCommand({ CompatibleRuntime, CompatibleArchitecture, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda layers: ${error.message}`);
            throw error;
        }
    }
}

export class ListTags extends LambdaTool {
    constructor() {
        super('ListTags', 'Retrieves tags for a specified Lambda function, event source mapping, or code signing configuration.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                Resource: {
                    type: 'string',
                    description: 'The ARN of the resource (Lambda function, event source mapping, or code signing configuration).'
                }
            },
            required: ['Resource', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, Resource } = args;
            
            const command = new ListTagsCommand({ Resource });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda tags: ${error.message}`);
            throw error;
        }
    }
}

export class ListVersionsByFunction extends LambdaTool {
    constructor() {
        super('ListVersionsByFunction', 'Lists all versions of a specified Lambda function.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Marker: {
                    type: 'string',
                    description: 'Pagination token for the next page of results (optional).'
                },
                MaxItems: {
                    type: 'number',
                    description: 'Maximum number of results to return (optional).'
                }
            },
            required: ['FunctionName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, FunctionName, Marker, MaxItems } = args;
            
            const command = new ListVersionsByFunctionCommand({ FunctionName, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda versions: ${error.message}`);
            throw error;
        }
    }
}

export const lambdaTools = {
    GetAlias,
    GetFunction,
    GetFunctionConfiguration,
    GetFunctionUrlConfig,
    GetLayerVersion,
    GetLayerVersionPolicy,
    GetLambdaFunctionPolicy,
    ListAliases,
    ListFunctions,
    ListLayers,
    ListTags,
    ListVersionsByFunction,
}; 