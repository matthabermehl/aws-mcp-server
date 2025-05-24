import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    Route53Client,
    ListHostedZonesCommand,
    ListResourceRecordSetsCommand,
    GetHostedZoneCommand,
} from "@aws-sdk/client-route-53";

class Route53Tool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const route53Client = this.getRoute53Client(region);
        try {
            const response = await route53Client.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Route53 command: ${error.message}`);
            throw error;
        }
    }

    getRoute53Client(region) {
        return new Route53Client({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class ListHostedZones extends Route53Tool {
    constructor() {
        super('ListHostedZones', 'Lists all hosted zones in your account to locate the zone for the domain of interest.', {
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
            
            const command = new ListHostedZonesCommand();
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing hosted zones: ${error.message}`);
            throw error;
        }
    }
}

export class ListResourceRecordSets extends Route53Tool {
    constructor() {
        super('ListResourceRecordSets', 'Lists all DNS records (e.g., A, CNAME, TXT) for a specific hosted zone.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                hostedZoneId: {
                    type: 'string',
                    description: 'The ID of the hosted zone to list records for.'
                }
            },
            required: ['hostedZoneId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, hostedZoneId } = args;
            
            const command = new ListResourceRecordSetsCommand({ HostedZoneId: hostedZoneId });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing resource record sets: ${error.message}`);
            throw error;
        }
    }
}

export class GetHostedZone extends Route53Tool {
    constructor() {
        super('GetHostedZone', 'Retrieves information about a specific hosted zone, such as its ID or associated domain.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                hostedZoneId: {
                    type: 'string',
                    description: 'The ID of the hosted zone to retrieve information for.'
                }
            },
            required: ['hostedZoneId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, hostedZoneId } = args;
            
            const command = new GetHostedZoneCommand({ Id: hostedZoneId });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting hosted zone: ${error.message}`);
            throw error;
        }
    }
}

export const route53Tools = {
    ListHostedZones,
    ListResourceRecordSets,
    GetHostedZone,
}; 