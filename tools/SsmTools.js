import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    SSMClient,
    GetParameterCommand,
    GetParametersCommand,
    GetParameterHistoryCommand,
    GetParametersByPathCommand,
    DescribeParametersCommand,
} from "@aws-sdk/client-ssm";

class SsmTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const ssmClient = this.getSsmClient(region);
        try {
            const response = await ssmClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing SSM command: ${error.message}`);
            throw error;
        }
    }

    getSsmClient(region) {
        return new SSMClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class GetParameter extends SsmTool {
    constructor() {
        super('GetParameter', 'Retrieves the value of a parameter.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                name: {
                    type: 'string',
                    description: 'The name of the parameter to retrieve.'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter value as plaintext (optional).'
                }
            },
            required: ['name', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, name, withDecryption } = args;
            
            const command = new GetParameterCommand({ Name: name, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameter: ${error.message}`);
            throw error;
        }
    }
}

export class GetParameters extends SsmTool {
    constructor() {
        super('GetParameters', 'Retrieves the values of multiple parameters.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                names: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'The names of the parameters to retrieve.'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter values as plaintext (optional).'
                }
            },
            required: ['names', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, names, withDecryption } = args;
            
            const command = new GetParametersCommand({ Names: names, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameters: ${error.message}`);
            throw error;
        }
    }
}

export class GetParameterHistory extends SsmTool {
    constructor() {
        super('GetParameterHistory', 'Retrieves the history of a parameter.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                name: {
                    type: 'string',
                    description: 'The name of the parameter to retrieve history for.'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter values as plaintext (optional).'
                }
            },
            required: ['name', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, name, withDecryption } = args;
            
            const command = new GetParameterHistoryCommand({ Name: name, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameter history: ${error.message}`);
            throw error;
        }
    }
}

export class GetParametersByPath extends SsmTool {
    constructor() {
        super('GetParametersByPath', 'Retrieves parameters from a specified path.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                path: {
                    type: 'string',
                    description: 'The path to retrieve parameters from.'
                },
                recursive: {
                    type: 'boolean',
                    description: 'Whether to retrieve parameters recursively (optional).'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter values as plaintext (optional).'
                }
            },
            required: ['path', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, path, recursive, withDecryption } = args;
            
            const command = new GetParametersByPathCommand({ Path: path, Recursive: recursive, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameters by path: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeParameters extends SsmTool {
    constructor() {
        super('DescribeParameters', 'Describes one or more parameters. If a NextToken is provided, it will be used to paginate results - so please call the function again, providing nextToken to it as an argument.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            Key: { type: 'string', description: 'The name of the filter key.' },
                            Values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'The values for the filter key.'
                            }
                        },
                        required: ['Key', 'Values']
                    },
                    description: 'Filters to apply when describing parameters (optional).'
                },
                parameterFilters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            Key: { type: 'string', description: 'The name of the parameter filter key.' },
                            Option: { type: 'string', description: 'The filter option to use.' },
                            Values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'The values for the parameter filter key.'
                            }
                        },
                        required: ['Key']
                    },
                    description: 'Parameter filters to apply when describing parameters (optional).'
                },
                maxResults: {
                    type: 'number',
                    description: 'The maximum number of results to return (optional).'
                },
                nextToken: {
                    type: 'string',
                    description: 'A token to specify where to start paginating results (optional).'
                },
                shared: {
                    type: 'boolean',
                    description: 'Whether to include shared parameters (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filters, parameterFilters, maxResults, nextToken, shared } = args;
            
            const command = new DescribeParametersCommand({
                Filters: filters,
                ParameterFilters: parameterFilters,
                MaxResults: maxResults,
                NextToken: nextToken,
                Shared: shared
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing parameters: ${error.message}`);
            throw error;
        }
    }
}

export const ssmTools = {
    GetParameter,
    GetParameters,
    GetParameterHistory,
    GetParametersByPath,
    DescribeParameters,
}; 