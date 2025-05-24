import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
    ConfigServiceClient,
    BatchGetAggregateResourceConfigCommand,
    BatchGetResourceConfigCommand,
    DescribeAggregateComplianceByConfigRulesCommand,
    DescribeComplianceByConfigRuleCommand,
    DescribeComplianceByResourceCommand,
    DescribeConfigRuleEvaluationStatusCommand,
    DescribeConfigRulesCommand,
    DescribeRemediationExecutionStatusCommand,
    DescribeConfigurationAggregatorSourcesStatusCommand,
    GetAggregateComplianceDetailsByConfigRuleCommand,
    GetComplianceDetailsByConfigRuleCommand,
    GetComplianceDetailsByResourceCommand,
    GetDiscoveredResourceCountsCommand,
    SelectAggregateResourceConfigCommand,
    SelectResourceConfigCommand,
    StartConfigRulesEvaluationCommand,
    StartRemediationExecutionCommand,
    GetResourceConfigHistoryCommand,
    ListTagsForResourceCommand,
} from "@aws-sdk/client-config-service";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class ConfigServiceTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const configClient = this.getConfigServiceClient(account, region);
        try {
            const response = await configClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Config Service command: ${error.message}`);
            throw error;
        }
    }

    getConfigServiceClient(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new ConfigServiceClient({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class BatchGetAggregateResourceConfig extends ConfigServiceTool {
    constructor() {
        super('BatchGetAggregateResourceConfig', 'Returns the current configuration state of multiple resources across accounts and regions in an aggregator.', {
            type: 'object',
            properties: {
                account,
                region,
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                resourceIdentifiers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            sourceAccountId: { type: 'string' },
                            sourceRegion: { type: 'string' },
                            resourceId: { type: 'string' },
                            resourceType: { type: 'string' }
                        },
                        required: ['sourceAccountId', 'sourceRegion', 'resourceId', 'resourceType']
                    },
                    description: 'List of resource identifiers to get configuration for.'
                }
            },
            required: ['configurationAggregatorName', 'resourceIdentifiers', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configurationAggregatorName, resourceIdentifiers } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting aggregate resource configurations in ${account}/${region}...`
            });

            const command = new BatchGetAggregateResourceConfigCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ResourceIdentifiers: resourceIdentifiers
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting aggregate resource configs: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class BatchGetResourceConfig extends ConfigServiceTool {
    constructor() {
        super('BatchGetResourceConfig', 'Retrieves the current configuration of multiple resources.', {
            type: 'object',
            properties: {
                account,
                region,
                resourceKeys: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            resourceType: { type: 'string' },
                            resourceId: { type: 'string' }
                        },
                        required: ['resourceType', 'resourceId']
                    },
                    description: 'List of resource keys to get configuration for.'
                }
            },
            required: ['resourceKeys', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, resourceKeys } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting resource configurations in ${account}/${region}...`
            });

            const command = new BatchGetResourceConfigCommand({
                ResourceKeys: resourceKeys
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting resource configs: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeAggregateComplianceByConfigRules extends ConfigServiceTool {
    constructor() {
        super('DescribeAggregateComplianceByConfigRules', 'Provides the compliance status of the specified configuration rules across accounts and regions.', {
            type: 'object',
            properties: {
                account,
                region,
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to describe.'
                }
            },
            required: ['configurationAggregatorName', 'configRuleNames', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configurationAggregatorName, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing aggregate compliance for config rules in ${account}/${region}...`
            });

            const command = new DescribeAggregateComplianceByConfigRulesCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing aggregate compliance: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeComplianceByConfigRule extends ConfigServiceTool {
    constructor() {
        super('DescribeComplianceByConfigRule', 'Returns the compliance status for a specific configuration rule.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configRuleName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleName } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing compliance for config rule ${configRuleName} in ${account}/${region}...`
            });

            const command = new DescribeComplianceByConfigRuleCommand({
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing compliance by config rule: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeComplianceByResource extends ConfigServiceTool {
    constructor() {
        super('DescribeComplianceByResource', 'Returns the compliance status for a specific resource.', {
            type: 'object',
            properties: {
                account,
                region,
                resourceType: {
                    type: 'string',
                    description: 'The type of the resource (e.g., AWS::EC2::Instance).'
                },
                resourceId: {
                    type: 'string',
                    description: 'The ID of the resource.'
                }
            },
            required: ['resourceType', 'resourceId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, resourceType, resourceId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing compliance for resource ${resourceType}/${resourceId} in ${account}/${region}...`
            });

            const command = new DescribeComplianceByResourceCommand({
                ResourceType: resourceType,
                ResourceId: resourceId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing compliance by resource: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeConfigRuleEvaluationStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigRuleEvaluationStatus', 'Returns the evaluation status of the specified configuration rules.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to evaluate.'
                }
            },
            required: ['configRuleNames', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing evaluation status for config rules in ${account}/${region}...`
            });

            const command = new DescribeConfigRuleEvaluationStatusCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing config rule evaluation status: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeConfigRules extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigRules', 'Returns details about the specified configuration rules.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to describe.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing config rules in ${account}/${region}...`
            });

            const command = new DescribeConfigRulesCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing config rules: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeRemediationExecutionStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeRemediationExecutionStatus', 'Returns the status of the remediation execution for the specified rules.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to check remediation status.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing remediation execution status in ${account}/${region}...`
            });

            const command = new DescribeRemediationExecutionStatusCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing remediation execution status: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeConfigurationAggregatorSourcesStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigurationAggregatorSourcesStatus', 'Returns the status of the sources in the specified configuration aggregator.', {
            type: 'object',
            properties: {
                account,
                region,
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                }
            },
            required: ['configurationAggregatorName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configurationAggregatorName } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing configuration aggregator sources status for ${configurationAggregatorName} in ${account}/${region}...`
            });

            const command = new DescribeConfigurationAggregatorSourcesStatusCommand({
                ConfigurationAggregatorName: configurationAggregatorName
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing configuration aggregator sources status: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetAggregateComplianceDetailsByConfigRule extends ConfigServiceTool {
    constructor() {
        super('GetAggregateComplianceDetailsByConfigRule', 'Returns compliance details for a specific configuration rule across accounts and regions.', {
            type: 'object',
            properties: {
                account,
                region,
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configurationAggregatorName', 'configRuleName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configurationAggregatorName, configRuleName } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting aggregate compliance details for rule ${configRuleName} in ${account}/${region}...`
            });

            const command = new GetAggregateComplianceDetailsByConfigRuleCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting aggregate compliance details: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetComplianceDetailsByConfigRule extends ConfigServiceTool {
    constructor() {
        super('GetComplianceDetailsByConfigRule', 'Returns compliance details for a specific configuration rule.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configRuleName', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleName } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting compliance details for rule ${configRuleName} in ${account}/${region}...`
            });

            const command = new GetComplianceDetailsByConfigRuleCommand({
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting compliance details by config rule: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetComplianceDetailsByResource extends ConfigServiceTool {
    constructor() {
        super('GetComplianceDetailsByResource', 'Returns compliance details for a specific resource.', {
            type: 'object',
            properties: {
                account,
                region,
                resourceType: {
                    type: 'string',
                    description: 'The type of the resource (e.g., AWS::EC2::Instance).'
                },
                resourceId: {
                    type: 'string',
                    description: 'The ID of the resource.'
                }
            },
            required: ['resourceType', 'resourceId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, resourceType, resourceId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting compliance details for resource ${resourceType}/${resourceId} in ${account}/${region}...`
            });

            const command = new GetComplianceDetailsByResourceCommand({
                ResourceType: resourceType,
                ResourceId: resourceId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting compliance details by resource: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetDiscoveredResourceCounts extends ConfigServiceTool {
    constructor() {
        super('GetDiscoveredResourceCounts', 'Returns the number of resources discovered by AWS Config.', {
            type: 'object',
            properties: {
                account,
                region
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting discovered resource counts in ${account}/${region}...`
            });

            const command = new GetDiscoveredResourceCountsCommand();
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting discovered resource counts: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class SelectAggregateResourceConfig extends ConfigServiceTool {
    constructor() {
        super('SelectAggregateResourceConfig', 'Selects aggregate resource configurations based on the specified query.', {
            type: 'object',
            properties: {
                account,
                region,
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                expression: {
                    type: 'string',
                    description: 'The query expression to select resources.'
                }
            },
            required: ['configurationAggregatorName', 'expression', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configurationAggregatorName, expression } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Selecting aggregate resource configurations in ${account}/${region}...`
            });

            const command = new SelectAggregateResourceConfigCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                Expression: expression
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error selecting aggregate resource config: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class SelectResourceConfig extends ConfigServiceTool {
    constructor() {
        super('SelectResourceConfig', 'Selects resource configurations based on the specified query.', {
            type: 'object',
            properties: {
                account,
                region,
                expression: {
                    type: 'string',
                    description: 'The query expression to select resources.'
                }
            },
            required: ['expression', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, expression } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Selecting resource configurations in ${account}/${region}...`
            });

            const command = new SelectResourceConfigCommand({
                Expression: expression
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error selecting resource config: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class StartConfigRulesEvaluation extends ConfigServiceTool {
    constructor() {
        super('StartConfigRulesEvaluation', 'Starts the evaluation of the specified configuration rules.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to evaluate.'
                }
            },
            required: ['configRuleNames', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Starting config rules evaluation in ${account}/${region}...`
            });

            const command = new StartConfigRulesEvaluationCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error starting config rules evaluation: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class StartRemediationExecution extends ConfigServiceTool {
    constructor() {
        super('StartRemediationExecution', 'Starts the remediation execution for the specified rules.', {
            type: 'object',
            properties: {
                account,
                region,
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to execute remediation for.'
                }
            },
            required: ['configRuleNames', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, configRuleNames } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Starting remediation execution in ${account}/${region}...`
            });

            const command = new StartRemediationExecutionCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error starting remediation execution: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetResourceConfigHistory extends ConfigServiceTool {
    constructor() {
        super('GetResourceConfigHistory', 'Returns a chronological list of configuration changes for a specific resource.', {
            type: 'object',
            properties: {
                account,
                region,
                resourceType: {
                    type: 'string',
                    description: 'The resource type (e.g., AWS::EC2::Instance)'
                },
                resourceId: {
                    type: 'string',
                    description: 'The ID of the resource'
                },
                limit: {
                    type: 'number',
                    description: 'Maximum number of configuration items to return (optional)'
                }
            },
            required: ['resourceType', 'resourceId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, resourceType, resourceId, limit } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting resource config history for ${resourceType}/${resourceId} in ${account}/${region}...`
            });

            const command = new GetResourceConfigHistoryCommand({
                ResourceType: resourceType,
                ResourceId: resourceId,
                Limit: limit
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting resource config history: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListTagsForConfigResource extends ConfigServiceTool {
    constructor() {
        super('ListTagsForConfigResource', 'Lists the tags for a specified resource.', {
            type: 'object',
            properties: {
                account,
                region,
                resourceArn: {
                    type: 'string',
                    description: 'The ARN of the resource.'
                }
            },
            required: ['resourceArn', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, resourceArn } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing tags for resource ${resourceArn} in ${account}/${region}...`
            });

            const command = new ListTagsForResourceCommand({
                ResourceArn: resourceArn
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing tags for resource: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export const configServiceTools = {
    BatchGetAggregateResourceConfig,
    BatchGetResourceConfig,
    DescribeAggregateComplianceByConfigRules,
    DescribeComplianceByConfigRule,
    DescribeComplianceByResource,
    DescribeConfigRuleEvaluationStatus,
    DescribeConfigRules,
    DescribeRemediationExecutionStatus,
    DescribeConfigurationAggregatorSourcesStatus,
    GetAggregateComplianceDetailsByConfigRule,
    GetComplianceDetailsByConfigRule,
    GetComplianceDetailsByResource,
    GetDiscoveredResourceCounts,
    SelectAggregateResourceConfig,
    SelectResourceConfig,
    StartConfigRulesEvaluation,
    StartRemediationExecution,
    GetResourceConfigHistory,
    ListTagsForConfigResource,
}; 