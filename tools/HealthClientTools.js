import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
    HealthClient,
    DescribeAffectedEntitiesCommand,
    DescribeAffectedEntitiesForOrganizationCommand,
    DescribeEntityAggregatesCommand,
    DescribeEventDetailsCommand,
    DescribeEventsCommand,
    DescribeEventsForOrganizationCommand,
} from "@aws-sdk/client-health";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class HealthClientTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const healthClient = this.getHealthClient(account, region);
        try {
            const response = await healthClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Health command: ${error.message}`);
            throw error;
        }
    }

    getHealthClient(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new HealthClient({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class DescribeAffectedEntities extends HealthClientTool {
    constructor() {
        super('DescribeAffectedEntities', 'Identifies specific resources or entities affected by events.', {
            type: 'object',
            properties: {
                account,
                region,
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying affected entities.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filter } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing affected entities in ${account}/${region}...`
            });

            const command = new DescribeAffectedEntitiesCommand({ filter });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing affected entities: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeAffectedEntitiesForOrganization extends HealthClientTool {
    constructor() {
        super('DescribeAffectedEntitiesForOrganization', 'Queries affected entities across accounts in your organization.', {
            type: 'object',
            properties: {
                account,
                region,
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying affected entities for the organization.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filter } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing affected entities for organization in ${account}/${region}...`
            });

            const command = new DescribeAffectedEntitiesForOrganizationCommand({ filter });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing affected entities for organization: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeEntityAggregates extends HealthClientTool {
    constructor() {
        super('DescribeEntityAggregates', 'Provides a quick summary of how many entities are impacted by specific events.', {
            type: 'object',
            properties: {
                account,
                region,
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying entity aggregates.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filter } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing entity aggregates in ${account}/${region}...`
            });

            const command = new DescribeEntityAggregatesCommand({ filter });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing entity aggregates: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeEventDetails extends HealthClientTool {
    constructor() {
        super('DescribeEventDetails', 'Offers detailed information about specific events, essential for diagnosing issues.', {
            type: 'object',
            properties: {
                account,
                region,
                eventArns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of event ARNs to describe.'
                }
            },
            required: ['eventArns', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, eventArns } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing event details in ${account}/${region}...`
            });

            const command = new DescribeEventDetailsCommand({ eventArns });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing event details: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeEvents extends HealthClientTool {
    constructor() {
        super('DescribeEvents', 'Allows querying of events that meet certain filter criteria, giving a high-level view of incidents.', {
            type: 'object',
            properties: {
                account,
                region,
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying events.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filter } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing events in ${account}/${region}...`
            });

            const command = new DescribeEventsCommand({ filter });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing events: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class DescribeEventsForOrganization extends HealthClientTool {
    constructor() {
        super('DescribeEventsForOrganization', 'Queries events for the organization, providing a broader perspective.', {
            type: 'object',
            properties: {
                account,
                region,
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying organizational events.'
                }
            },
            required: ['account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, filter } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Describing events for organization in ${account}/${region}...`
            });

            const command = new DescribeEventsForOrganizationCommand({ filter });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing events for organization: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export const healthClientTools = {
    DescribeAffectedEntities,
    DescribeAffectedEntitiesForOrganization,
    DescribeEntityAggregates,
    DescribeEventDetails,
    DescribeEvents,
    DescribeEventsForOrganization,
}; 