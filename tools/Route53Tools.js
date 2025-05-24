import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
    Route53Client,
    ListHostedZonesCommand,
    ListResourceRecordSetsCommand,
    GetHostedZoneCommand,
} from "@aws-sdk/client-route-53";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class Route53Tool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const route53Client = this.getRoute53Client(account, region);
        try {
            const response = await route53Client.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing Route53 command: ${error.message}`);
            throw error;
        }
    }

    getRoute53Client(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new Route53Client({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class ListHostedZones extends Route53Tool {
    constructor() {
        super('ListHostedZones', 'Lists all hosted zones in your account to locate the zone for the domain of interest.', {
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
                data: `Listing hosted zones in ${account}/${region}...`
            });

            const command = new ListHostedZonesCommand();
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing hosted zones: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListResourceRecordSets extends Route53Tool {
    constructor() {
        super('ListResourceRecordSets', 'Lists all DNS records (e.g., A, CNAME, TXT) for a specific hosted zone.', {
            type: 'object',
            properties: {
                account,
                region,
                hostedZoneId: {
                    type: 'string',
                    description: 'The ID of the hosted zone to list records for.'
                }
            },
            required: ['hostedZoneId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, hostedZoneId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing resource record sets for hosted zone ${hostedZoneId} in ${account}/${region}...`
            });

            const command = new ListResourceRecordSetsCommand({ HostedZoneId: hostedZoneId });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing resource record sets: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetHostedZone extends Route53Tool {
    constructor() {
        super('GetHostedZone', 'Retrieves information about a specific hosted zone, such as its ID or associated domain.', {
            type: 'object',
            properties: {
                account,
                region,
                hostedZoneId: {
                    type: 'string',
                    description: 'The ID of the hosted zone to retrieve information for.'
                }
            },
            required: ['hostedZoneId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, hostedZoneId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting hosted zone ${hostedZoneId} in ${account}/${region}...`
            });

            const command = new GetHostedZoneCommand({ Id: hostedZoneId });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting hosted zone: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export const route53Tools = {
    ListHostedZones,
    ListResourceRecordSets,
    GetHostedZone,
}; 