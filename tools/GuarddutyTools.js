import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
    GuardDutyClient,
    ArchiveFindingsCommand,
    GetCoverageStatisticsCommand,
    GetDetectorCommand,
    GetFindingsCommand,
    GetFindingsStatisticsCommand,
    ListDetectorsCommand,
    ListFindingsCommand,
    UnarchiveFindingsCommand,
    UpdateFindingsFeedbackCommand,
    ListCoverageCommand,
} from "@aws-sdk/client-guardduty";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

class GuardDutyTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, account, region }) {
        const guardDutyClient = this.getGuardDutyClient(account, region);
        try {
            const response = await guardDutyClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing GuardDuty command: ${error.message}`);
            throw error;
        }
    }

    getGuardDutyClient(account, region) {
        const validAccounts = Object.keys(accountCredentials);
        if (!validAccounts.includes(account)) {
            throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
        }

        const credentials = accountCredentials[account];
        if (!credentials) {
            throw new Error(`No credentials found for account: ${account}`);
        }

        return new GuardDutyClient({
            region: region || defaultRegion,
            credentials,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

export class ArchiveFindings extends GuardDutyTool {
    constructor() {
        super('ArchiveFindings', 'Manages findings by archiving resolved or irrelevant ones.', {
            type: 'object',
            properties: {
                account,
                region,
                findingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of finding IDs to archive.'
                },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                }
            },
            required: ['findingIds', 'detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, findingIds, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Archiving findings in ${account}/${region}...`
            });

            const command = new ArchiveFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error archiving findings: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetCoverageStatistics extends GuardDutyTool {
    constructor() {
        super('GetCoverageStatistics', 'Provides aggregated statistics on coverage, useful in identifying gaps or under-monitored areas.', {
            type: 'object',
            properties: {
                account,
                region,
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve coverage statistics for.'
                }
            },
            required: ['detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting coverage statistics in ${account}/${region}...`
            });

            const command = new GetCoverageStatisticsCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting coverage statistics: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetDetector extends GuardDutyTool {
    constructor() {
        super('GetDetector', 'Retrieves details of GuardDuty detectors and confirms configurations.', {
            type: 'object',
            properties: {
                account,
                region,
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve.'
                }
            },
            required: ['detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting detector details in ${account}/${region}...`
            });

            const command = new GetDetectorCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting detector: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetFindings extends GuardDutyTool {
    constructor() {
        super('GetFindings', 'Core command to retrieve specific security findings for diagnosis.', {
            type: 'object',
            properties: {
                account,
                region,
                findingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of finding IDs to retrieve.'
                },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                }
            },
            required: ['findingIds', 'detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, findingIds, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting findings in ${account}/${region}...`
            });

            const command = new GetFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting findings: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class GetFindingsStatistics extends GuardDutyTool {
    constructor() {
        super('GetFindingsStatistics', 'Provides high-level summaries of finding statistics, aiding in trend analysis.', {
            type: 'object',
            properties: {
                account,
                region,
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve findings statistics for.'
                }
            },
            required: ['detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Getting findings statistics in ${account}/${region}...`
            });

            const command = new GetFindingsStatisticsCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting findings statistics: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListDetectors extends GuardDutyTool {
    constructor() {
        super('ListDetectors', 'Enumerates existing detectors for validating configurations.', {
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
                data: `Listing detectors in ${account}/${region}...`
            });

            const command = new ListDetectorsCommand();
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing detectors: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListFindings extends GuardDutyTool {
    constructor() {
        super('ListFindings', 'Lists all findings for broader analysis.', {
            type: 'object',
            properties: {
                account,
                region,
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                },
                maxResults: {
                    type: 'number',
                    description: 'The maximum number of findings to return (optional).'
                }
            },
            required: ['detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, detectorId, maxResults } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing findings in ${account}/${region}...`
            });

            const command = new ListFindingsCommand({
                DetectorId: detectorId,
                MaxResults: maxResults
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing findings: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class UnarchiveFindings extends GuardDutyTool {
    constructor() {
        super('UnarchiveFindings', 'Unarchives findings if they become relevant again.', {
            type: 'object',
            properties: {
                account,
                region,
                findingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of finding IDs to unarchive.'
                },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                }
            },
            required: ['findingIds', 'detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, findingIds, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Unarchiving findings in ${account}/${region}...`
            });

            const command = new UnarchiveFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error unarchiving findings: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class UpdateFindingsFeedback extends GuardDutyTool {
    constructor() {
        super('UpdateFindingsFeedback', 'Provides feedback on the utility of specific findings, improving system relevance.', {
            type: 'object',
            properties: {
                account,
                region,
                findingIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of finding IDs to provide feedback on.'
                },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                },
                feedback: {
                    type: 'string',
                    description: 'Feedback on the findings (e.g., "USEFUL", "NOT_USEFUL").'
                }
            },
            required: ['findingIds', 'detectorId', 'feedback', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, findingIds, detectorId, feedback } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Updating findings feedback in ${account}/${region}...`
            });

            const command = new UpdateFindingsFeedbackCommand({
                FindingIds: findingIds,
                DetectorId: detectorId,
                Feedback: feedback
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error updating findings feedback: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export class ListCoverage extends GuardDutyTool {
    constructor() {
        super('ListCoverage', 'Reviews coverage details and ensures all resources are being monitored.', {
            type: 'object',
            properties: {
                account,
                region,
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to review coverage for.'
                }
            },
            required: ['detectorId', 'account', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { account, region, detectorId } = args;
            
            // Emit initial progress
            user.emit('tool.output.chunk', {
                object: 'tool.output.chunk',
                toolCallId: id,
                data: `Listing coverage in ${account}/${region}...`
            });

            const command = new ListCoverageCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, account, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing coverage: ${error.message}`);
            user.emit('tool.error', {
                object: 'tool.error',
                toolCallId: id,
                data: error.message
            });
            throw error;
        }
    }
}

export const guardDutyTools = {
    ArchiveFindings,
    GetCoverageStatistics,
    GetDetector,
    GetFindings,
    GetFindingsStatistics,
    ListDetectors,
    ListFindings,
    UnarchiveFindings,
    UpdateFindingsFeedback,
    ListCoverage,
}; 