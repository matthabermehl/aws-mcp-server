import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

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

class GuardDutyTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const guardDutyClient = this.getGuardDutyClient(region);
        try {
            const response = await guardDutyClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing GuardDuty command: ${error.message}`);
            throw error;
        }
    }

    getGuardDutyClient(region) {
        return new GuardDutyClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class ArchiveFindings extends GuardDutyTool {
    constructor() {
        super('ArchiveFindings', 'Manages findings by archiving resolved or irrelevant ones.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['findingIds', 'detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, findingIds, detectorId } = args;
            
            const command = new ArchiveFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error archiving findings: ${error.message}`);
            throw error;
        }
    }
}

export class GetCoverageStatistics extends GuardDutyTool {
    constructor() {
        super('GetCoverageStatistics', 'Provides aggregated statistics on coverage, useful in identifying gaps or under-monitored areas.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve coverage statistics for.'
                }
            },
            required: ['detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, detectorId } = args;
            
            const command = new GetCoverageStatisticsCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting coverage statistics: ${error.message}`);
            throw error;
        }
    }
}

export class GetDetector extends GuardDutyTool {
    constructor() {
        super('GetDetector', 'Retrieves details of GuardDuty detectors and confirms configurations.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve.'
                }
            },
            required: ['detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, detectorId } = args;
            
            const command = new GetDetectorCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting detector: ${error.message}`);
            throw error;
        }
    }
}

export class GetFindings extends GuardDutyTool {
    constructor() {
        super('GetFindings', 'Core command to retrieve specific security findings for diagnosis.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['findingIds', 'detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, findingIds, detectorId } = args;
            
            const command = new GetFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting findings: ${error.message}`);
            throw error;
        }
    }
}

export class GetFindingsStatistics extends GuardDutyTool {
    constructor() {
        super('GetFindingsStatistics', 'Provides high-level summaries of finding statistics, aiding in trend analysis.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to retrieve findings statistics for.'
                }
            },
            required: ['detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, detectorId } = args;
            
            const command = new GetFindingsStatisticsCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting findings statistics: ${error.message}`);
            throw error;
        }
    }
}

export class ListDetectors extends GuardDutyTool {
    constructor() {
        super('ListDetectors', 'Enumerates existing detectors for validating configurations.', {
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
            
            const command = new ListDetectorsCommand();
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing detectors: ${error.message}`);
            throw error;
        }
    }
}

export class ListFindings extends GuardDutyTool {
    constructor() {
        super('ListFindings', 'Lists all findings for broader analysis.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector associated with the findings.'
                },
                maxResults: {
                    type: 'number',
                    description: 'The maximum number of findings to return (optional).'
                }
            },
            required: ['detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, detectorId, maxResults } = args;
            
            const command = new ListFindingsCommand({
                DetectorId: detectorId,
                MaxResults: maxResults
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing findings: ${error.message}`);
            throw error;
        }
    }
}

export class UnarchiveFindings extends GuardDutyTool {
    constructor() {
        super('UnarchiveFindings', 'Unarchives findings if they become relevant again.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['findingIds', 'detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, findingIds, detectorId } = args;
            
            const command = new UnarchiveFindingsCommand({
                FindingIds: findingIds,
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error unarchiving findings: ${error.message}`);
            throw error;
        }
    }
}

export class UpdateFindingsFeedback extends GuardDutyTool {
    constructor() {
        super('UpdateFindingsFeedback', 'Provides feedback on the utility of specific findings, improving system relevance.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
            required: ['findingIds', 'detectorId', 'feedback', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, findingIds, detectorId, feedback } = args;
            
            const command = new UpdateFindingsFeedbackCommand({
                FindingIds: findingIds,
                DetectorId: detectorId,
                Feedback: feedback
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error updating findings feedback: ${error.message}`);
            throw error;
        }
    }
}

export class ListCoverage extends GuardDutyTool {
    constructor() {
        super('ListCoverage', 'Reviews coverage details and ensures all resources are being monitored.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                detectorId: {
                    type: 'string',
                    description: 'The ID of the detector to review coverage for.'
                }
            },
            required: ['detectorId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, detectorId } = args;
            
            const command = new ListCoverageCommand({
                DetectorId: detectorId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing coverage: ${error.message}`);
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