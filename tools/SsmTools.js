import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
    SSMClient,
    GetParameterCommand,
    GetParametersCommand,
    GetParameterHistoryCommand,
    GetParametersByPathCommand,
    DescribeParametersCommand,
} from "@aws-sdk/client-ssm";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class SsmTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const ssmClient = this.getSsmClient(account, region);
        try {
            const response = await ssmClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing SSM command: ${error.message}`);
            throw error;
        }
    }

    getSsmClient(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new SSMClient({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class GetParameter extends SsmTool {
    constructor() {
        super('GetParameter', 'Retrieves the value of a parameter.', {
            type: 'object',
            properties: {
                account,
                region,
                name: {
                    type: 'string',
                    description: 'The name of the parameter to retrieve.'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter value as plaintext (optional).'
                }
            },
            required: ['name', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, name, withDecryption } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting parameter ${name} in ${account}/${region}...`
            });

            const command = new GetParameterCommand({ Name: name, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameter: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetParameters extends SsmTool {
    constructor() {
        super('GetParameters', 'Retrieves the values of multiple parameters.', {
            type: 'object',
            properties: {
                account,
                region,
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
            required: ['names', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, names, withDecryption } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting parameters ${names.join(', ')} in ${account}/${region}...`
            });

            const command = new GetParametersCommand({ Names: names, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameters: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetParameterHistory extends SsmTool {
    constructor() {
        super('GetParameterHistory', 'Retrieves the history of a parameter.', {
            type: 'object',
            properties: {
                account,
                region,
                name: {
                    type: 'string',
                    description: 'The name of the parameter to retrieve history for.'
                },
                withDecryption: {
                    type: 'boolean',
                    description: 'Whether to retrieve the parameter values as plaintext (optional).'
                }
            },
            required: ['name', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, name, withDecryption } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting parameter history for ${name} in ${account}/${region}...`
            });

            const command = new GetParameterHistoryCommand({ Name: name, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameter history: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetParametersByPath extends SsmTool {
    constructor() {
        super('GetParametersByPath', 'Retrieves parameters from a specified path.', {
            type: 'object',
            properties: {
                account,
                region,
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
            required: ['path', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, path, recursive, withDecryption } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting parameters by path ${path} in ${account}/${region}...`
            });

            const command = new GetParametersByPathCommand({ Path: path, Recursive: recursive, WithDecryption: withDecryption });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting parameters by path: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeParameters extends SsmTool {
    constructor() {
        super('DescribeParameters', 'Describes one or more parameters. If a NextToken is provided, it will be used to paginate results - so please call the function again, providing nextToken to it as an argument.', {
            type: 'object',
            properties: {
                account,
                region,
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
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filters, parameterFilters, maxResults, nextToken, shared } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing parameters in ${account}/${region}...`
            });

            const command = new DescribeParametersCommand({
                Filters: filters,
                ParameterFilters: parameterFilters,
                MaxResults: maxResults,
                NextToken: nextToken,
                Shared: shared
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing parameters: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
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