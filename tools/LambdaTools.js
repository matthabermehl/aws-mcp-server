import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

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

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class LambdaTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const lambdaClient = this.getLambdaClient(account, region);
        try {
            const response = await lambdaClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Lambda command: ${error.message}`);
            throw error;
        }
    }

    getLambdaClient(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new LambdaClient({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class GetAlias extends LambdaTool {
    constructor() {
        super('GetAlias', 'Returns details about a specified alias for an AWS Lambda function.', {
            type: 'object',
            properties: {
                account,
                region,
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Name: {
                    type: 'string',
                    description: 'The name of the alias.'
                }
            },
            required: ['FunctionName', 'Name', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, Name } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda alias details in ${account}/${region}...`
            });

            const command = new GetAliasCommand({ FunctionName, Name });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda alias: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetFunction extends LambdaTool {
    constructor() {
        super('GetFunction', 'Returns information about an AWS Lambda function or a specific version.', {
            type: 'object',
            properties: {
                account,
                region,
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias to get details for (optional).'
                }
            },
            required: ['FunctionName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, Qualifier } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda function details in ${account}/${region}...`
            });

            const command = new GetFunctionCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetFunctionConfiguration extends LambdaTool {
    constructor() {
        super('GetFunctionConfiguration', 'Retrieves version-specific settings for an AWS Lambda function or a specific version.', {
            type: 'object',
            properties: {
                account,
                region,
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias to get configuration for (optional).'
                }
            },
            required: ['FunctionName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, Qualifier } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda function configuration in ${account}/${region}...`
            });

            const command = new GetFunctionConfigurationCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function configuration: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetFunctionUrlConfig extends LambdaTool {
    constructor() {
        super('GetFunctionUrlConfig', 'Fetches details of an AWS Lambda function URL.', {
            type: 'object',
            properties: {
                account,
                region,
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                }
            },
            required: ['FunctionName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda function URL config in ${account}/${region}...`
            });

            const command = new GetFunctionUrlConfigCommand({ FunctionName });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function URL config: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetLayerVersion extends LambdaTool {
    constructor() {
        super('GetLayerVersion', 'Retrieves information about a specific version of an AWS Lambda layer.', {
            type: 'object',
            properties: {
                account,
                region,
                LayerName: {
                    type: 'string',
                    description: 'The name of the Lambda layer.'
                },
                VersionNumber: {
                    type: 'number',
                    description: 'The version number of the layer.'
                }
            },
            required: ['LayerName', 'VersionNumber', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, LayerName, VersionNumber } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda layer version in ${account}/${region}...`
            });

            const command = new GetLayerVersionCommand({ LayerName, VersionNumber });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda layer version: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetLayerVersionPolicy extends LambdaTool {
    constructor() {
        super('GetLayerVersionPolicy', 'Retrieves the permission policy for a specified Lambda layer version.', {
            type: 'object',
            properties: {
                account,
                region,
                LayerName: {
                    type: 'string',
                    description: 'The name of the Lambda layer.'
                },
                VersionNumber: {
                    type: 'number',
                    description: 'The version number of the layer.'
                }
            },
            required: ['LayerName', 'VersionNumber', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, LayerName, VersionNumber } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda layer version policy in ${account}/${region}...`
            });

            const command = new GetLayerVersionPolicyCommand({ LayerName, VersionNumber });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda layer version policy: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetLambdaFunctionPolicy extends LambdaTool {
    constructor() {
        super('GetLambdaFunctionPolicy', 'Returns the resource-based IAM policy for an AWS Lambda function, version, or alias.', {
            type: 'object',
            properties: {
                account,
                region,
                FunctionName: {
                    type: 'string',
                    description: 'The name of the Lambda function.'
                },
                Qualifier: {
                    type: 'string',
                    description: 'The function version or alias (optional).'
                }
            },
            required: ['FunctionName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, Qualifier } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting Lambda function policy in ${account}/${region}...`
            });

            const command = new GetPolicyCommand({ FunctionName, Qualifier });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting Lambda function policy: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListAliases extends LambdaTool {
    constructor() {
        super('ListAliases', 'Returns a list of aliases for a specified AWS Lambda function.', {
            type: 'object',
            properties: {
                account,
                region,
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
            required: ['FunctionName']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, FunctionVersion, Marker, MaxItems } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing Lambda aliases in ${account}/${region}...`
            });

            const command = new ListAliasesCommand({ FunctionName, FunctionVersion, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda aliases: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListFunctions extends LambdaTool {
    constructor() {
        super('ListFunctions', 'Lists AWS Lambda functions in the specified account and region.', {
            type: 'object',
            properties: {
                account,
                region,
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
            }
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionVersion, Marker, MaxItems } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing Lambda functions in ${account}/${region}...`
            });

            const command = new ListFunctionsCommand({ FunctionVersion, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda functions: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListLayers extends LambdaTool {
    constructor() {
        super('ListLayers', 'Lists available Lambda layers and their latest versions in the specified account and region.', {
            type: 'object',
            properties: {
                account,
                region,
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
            }
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, CompatibleRuntime, CompatibleArchitecture, Marker, MaxItems } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing Lambda layers in ${account}/${region}...`
            });

            const command = new ListLayersCommand({ CompatibleRuntime, CompatibleArchitecture, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda layers: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListTags extends LambdaTool {
    constructor() {
        super('ListTags', 'Retrieves tags for a specified Lambda function, event source mapping, or code signing configuration.', {
            type: 'object',
            properties: {
                account,
                region,
                Resource: {
                    type: 'string',
                    description: 'The ARN of the resource (Lambda function, event source mapping, or code signing configuration).'
                }
            },
            required: ['Resource']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, Resource } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing Lambda tags in ${account}/${region}...`
            });

            const command = new ListTagsCommand({ Resource });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda tags: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListVersionsByFunction extends LambdaTool {
    constructor() {
        super('ListVersionsByFunction', 'Lists all versions of a specified Lambda function.', {
            type: 'object',
            properties: {
                account,
                region,
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
            required: ['FunctionName']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, FunctionName, Marker, MaxItems } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing Lambda versions for function in ${account}/${region}...`
            });

            const command = new ListVersionsByFunctionCommand({ FunctionName, Marker, MaxItems });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing Lambda versions: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
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