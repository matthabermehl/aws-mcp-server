import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

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

class HealthClientTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const healthClient = this.getHealthClient(region);
        try {
            const response = await healthClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Health command: ${error.message}`);
            throw error;
        }
    }

    getHealthClient(region) {
        return new HealthClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class DescribeAffectedEntities extends HealthClientTool {
    constructor() {
        super('DescribeAffectedEntities', 'Identifies specific resources or entities affected by events.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying affected entities.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filter } = args;
            
            const command = new DescribeAffectedEntitiesCommand({ filter });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing affected entities: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeAffectedEntitiesForOrganization extends HealthClientTool {
    constructor() {
        super('DescribeAffectedEntitiesForOrganization', 'Queries affected entities across accounts in your organization.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying affected entities for the organization.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filter } = args;
            
            const command = new DescribeAffectedEntitiesForOrganizationCommand({ filter });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing affected entities for organization: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeEntityAggregates extends HealthClientTool {
    constructor() {
        super('DescribeEntityAggregates', 'Provides a quick summary of how many entities are impacted by specific events.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying entity aggregates.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filter } = args;
            
            const command = new DescribeEntityAggregatesCommand({ filter });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing entity aggregates: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeEventDetails extends HealthClientTool {
    constructor() {
        super('DescribeEventDetails', 'Offers detailed information about specific events, essential for diagnosing issues.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                eventArns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of event ARNs to describe.'
                }
            },
            required: ['eventArns', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, eventArns } = args;
            
            const command = new DescribeEventDetailsCommand({ eventArns });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing event details: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeEvents extends HealthClientTool {
    constructor() {
        super('DescribeEvents', 'Allows querying of events that meet certain filter criteria, giving a high-level view of incidents.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying events.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filter } = args;
            
            const command = new DescribeEventsCommand({ filter });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing events: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeEventsForOrganization extends HealthClientTool {
    constructor() {
        super('DescribeEventsForOrganization', 'Queries events for the organization, providing a broader perspective.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                filter: {
                    type: 'object',
                    description: 'Filter to apply when querying organizational events.'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, filter } = args;
            
            const command = new DescribeEventsForOrganizationCommand({ filter });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing events for organization: ${error.message}`);
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