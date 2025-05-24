import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

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

class ConfigServiceTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const configClient = this.getConfigServiceClient(region);
        try {
            const response = await configClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Config Service command: ${error.message}`);
            throw error;
        }
    }

    getConfigServiceClient(region) {
        return new ConfigServiceClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class BatchGetAggregateResourceConfig extends ConfigServiceTool {
    constructor() {
        super('BatchGetAggregateResourceConfig', 'Returns the current configuration state of multiple resources across accounts and regions in an aggregator.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['configurationAggregatorName', 'resourceIdentifiers', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configurationAggregatorName, resourceIdentifiers } = args;
            
            const command = new BatchGetAggregateResourceConfigCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ResourceIdentifiers: resourceIdentifiers
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting aggregate resource configs: ${error.message}`);
            throw error;
        }
    }
}

export class BatchGetResourceConfig extends ConfigServiceTool {
    constructor() {
        super('BatchGetResourceConfig', 'Retrieves the current configuration of multiple resources.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['resourceKeys', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, resourceKeys } = args;
            
            const command = new BatchGetResourceConfigCommand({
                ResourceKeys: resourceKeys
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting resource configs: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeAggregateComplianceByConfigRules extends ConfigServiceTool {
    constructor() {
        super('DescribeAggregateComplianceByConfigRules', 'Provides the compliance status of the specified configuration rules across accounts and regions.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['configurationAggregatorName', 'configRuleNames', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configurationAggregatorName, configRuleNames } = args;
            
            const command = new DescribeAggregateComplianceByConfigRulesCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing aggregate compliance: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeComplianceByConfigRule extends ConfigServiceTool {
    constructor() {
        super('DescribeComplianceByConfigRule', 'Returns the compliance status for a specific configuration rule.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configRuleName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleName } = args;
            
            const command = new DescribeComplianceByConfigRuleCommand({
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing compliance by config rule: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeComplianceByResource extends ConfigServiceTool {
    constructor() {
        super('DescribeComplianceByResource', 'Returns the compliance status for a specific resource.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                resourceType: {
                    type: 'string',
                    description: 'The type of the resource (e.g., AWS::EC2::Instance).'
                },
                resourceId: {
                    type: 'string',
                    description: 'The ID of the resource.'
                }
            },
            required: ['resourceType', 'resourceId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, resourceType, resourceId } = args;
            
            const command = new DescribeComplianceByResourceCommand({
                ResourceType: resourceType,
                ResourceId: resourceId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing compliance by resource: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeConfigRuleEvaluationStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigRuleEvaluationStatus', 'Returns the evaluation status of the specified configuration rules.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to evaluate.'
                }
            },
            required: ['configRuleNames', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleNames } = args;
            
            const command = new DescribeConfigRuleEvaluationStatusCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing config rule evaluation status: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeConfigRules extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigRules', 'Returns details about the specified configuration rules.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to describe.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleNames } = args;
            
            const command = new DescribeConfigRulesCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing config rules: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeRemediationExecutionStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeRemediationExecutionStatus', 'Returns the status of the remediation execution for the specified rules.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to check remediation status.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleNames } = args;
            
            const command = new DescribeRemediationExecutionStatusCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing remediation execution status: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeConfigurationAggregatorSourcesStatus extends ConfigServiceTool {
    constructor() {
        super('DescribeConfigurationAggregatorSourcesStatus', 'Returns the status of the sources in the specified configuration aggregator.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                }
            },
            required: ['configurationAggregatorName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configurationAggregatorName } = args;
            
            const command = new DescribeConfigurationAggregatorSourcesStatusCommand({
                ConfigurationAggregatorName: configurationAggregatorName
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing configuration aggregator sources status: ${error.message}`);
            throw error;
        }
    }
}

export class GetAggregateComplianceDetailsByConfigRule extends ConfigServiceTool {
    constructor() {
        super('GetAggregateComplianceDetailsByConfigRule', 'Returns compliance details for a specific configuration rule across accounts and regions.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configurationAggregatorName', 'configRuleName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configurationAggregatorName, configRuleName } = args;
            
            const command = new GetAggregateComplianceDetailsByConfigRuleCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting aggregate compliance details: ${error.message}`);
            throw error;
        }
    }
}

export class GetComplianceDetailsByConfigRule extends ConfigServiceTool {
    constructor() {
        super('GetComplianceDetailsByConfigRule', 'Returns compliance details for a specific configuration rule.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleName: {
                    type: 'string',
                    description: 'The name of the configuration rule.'
                }
            },
            required: ['configRuleName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleName } = args;
            
            const command = new GetComplianceDetailsByConfigRuleCommand({
                ConfigRuleName: configRuleName
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting compliance details by config rule: ${error.message}`);
            throw error;
        }
    }
}

export class GetComplianceDetailsByResource extends ConfigServiceTool {
    constructor() {
        super('GetComplianceDetailsByResource', 'Returns compliance details for a specific resource.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                resourceType: {
                    type: 'string',
                    description: 'The type of the resource (e.g., AWS::EC2::Instance).'
                },
                resourceId: {
                    type: 'string',
                    description: 'The ID of the resource.'
                }
            },
            required: ['resourceType', 'resourceId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, resourceType, resourceId } = args;
            
            const command = new GetComplianceDetailsByResourceCommand({
                ResourceType: resourceType,
                ResourceId: resourceId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting compliance details by resource: ${error.message}`);
            throw error;
        }
    }
}

export class GetDiscoveredResourceCounts extends ConfigServiceTool {
    constructor() {
        super('GetDiscoveredResourceCounts', 'Returns the number of resources discovered by AWS Config.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region } = args;
            
            const command = new GetDiscoveredResourceCountsCommand();
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting discovered resource counts: ${error.message}`);
            throw error;
        }
    }
}

export class SelectAggregateResourceConfig extends ConfigServiceTool {
    constructor() {
        super('SelectAggregateResourceConfig', 'Selects aggregate resource configurations based on the specified query.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configurationAggregatorName: {
                    type: 'string',
                    description: 'The name of the configuration aggregator.'
                },
                expression: {
                    type: 'string',
                    description: 'The query expression to select resources.'
                }
            },
            required: ['configurationAggregatorName', 'expression', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configurationAggregatorName, expression } = args;
            
            const command = new SelectAggregateResourceConfigCommand({
                ConfigurationAggregatorName: configurationAggregatorName,
                Expression: expression
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error selecting aggregate resource config: ${error.message}`);
            throw error;
        }
    }
}

export class SelectResourceConfig extends ConfigServiceTool {
    constructor() {
        super('SelectResourceConfig', 'Selects resource configurations based on the specified query.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                expression: {
                    type: 'string',
                    description: 'The query expression to select resources.'
                }
            },
            required: ['expression', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, expression } = args;
            
            const command = new SelectResourceConfigCommand({
                Expression: expression
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error selecting resource config: ${error.message}`);
            throw error;
        }
    }
}

export class StartConfigRulesEvaluation extends ConfigServiceTool {
    constructor() {
        super('StartConfigRulesEvaluation', 'Starts the evaluation of the specified configuration rules.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to evaluate.'
                }
            },
            required: ['configRuleNames', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleNames } = args;
            
            const command = new StartConfigRulesEvaluationCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error starting config rules evaluation: ${error.message}`);
            throw error;
        }
    }
}

export class StartRemediationExecution extends ConfigServiceTool {
    constructor() {
        super('StartRemediationExecution', 'Starts the remediation execution for the specified rules.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                configRuleNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of configuration rule names to execute remediation for.'
                }
            },
            required: ['configRuleNames', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, configRuleNames } = args;
            
            const command = new StartRemediationExecutionCommand({
                ConfigRuleNames: configRuleNames
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error starting remediation execution: ${error.message}`);
            throw error;
        }
    }
}

export class GetResourceConfigHistory extends ConfigServiceTool {
    constructor() {
        super('GetResourceConfigHistory', 'Returns a chronological list of configuration changes for a specific resource.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['resourceType', 'resourceId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, resourceType, resourceId, limit } = args;
            
            const command = new GetResourceConfigHistoryCommand({
                ResourceType: resourceType,
                ResourceId: resourceId,
                Limit: limit
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting resource config history: ${error.message}`);
            throw error;
        }
    }
}

export class ListTagsForConfigResource extends ConfigServiceTool {
    constructor() {
        super('ListTagsForConfigResource', 'Lists the tags for a specified resource.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                resourceArn: {
                    type: 'string',
                    description: 'The ARN of the resource.'
                }
            },
            required: ['resourceArn', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, resourceArn } = args;
            
            const command = new ListTagsForResourceCommand({
                ResourceArn: resourceArn
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing tags for resource: ${error.message}`);
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