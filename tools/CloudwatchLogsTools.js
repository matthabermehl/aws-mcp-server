import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    CloudWatchLogsClient,
    DescribeLogGroupsCommand,
    DescribeLogStreamsCommand,
    FilterLogEventsCommand,
    GetLogEventsCommand,
    StartQueryCommand,
    GetQueryResultsCommand,
    DescribeQueriesCommand,
    GetLogRecordCommand,
    ListTagsForResourceCommand,
} from "@aws-sdk/client-cloudwatch-logs";

// Helper function to truncate log lines and add AWS Console URLs
const truncateLogLines = (response, region, logGroupName, logStreamName = null) => {
    if (!response) return response;
    
    // Construct base AWS Console URL
    const baseUrl = `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group`;
    
    // Add log group URL
    const encodedLogGroupName = encodeURIComponent(logGroupName);
    const logGroupUrl = `${baseUrl}/${encodedLogGroupName}`;
    
    // Add URLs to response
    response.consoleUrls = {
        logGroup: logGroupUrl
    };

    // For FilterLogEvents and GetLogEvents
    if (response.events) {
        // If we have a specific stream, add its URL
        if (logStreamName) {
            const encodedStreamName = encodeURIComponent(logStreamName);
            response.consoleUrls.logStream = `${logGroupUrl}/log-events/${encodedStreamName}`;
        }

        response.events = response.events.map(event => ({
            ...event,
            message: event.message?.length > 200 ?
                event.message.substring(0, 197) + '...' :
                event.message,
            // Add stream URL for each event that has a stream name
            consoleUrl: event.logStreamName ?
                `${logGroupUrl}/log-events/${encodeURIComponent(event.logStreamName)}` :
                undefined
        }));
    }
    
    return response;
};

class CloudwatchLogsTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    // Helper function to format filter patterns according to CloudWatch's regex syntax
    formatFilterPattern(pattern) {
        if (!pattern) return pattern;
        
        // For patterns with colons, wrap the entire pattern in quotes to treat it as a literal search
        if (pattern.includes(':')) {
            return `"${pattern}"`;
        }
        
        // For other patterns, use as is
        return pattern;
    }

    async executeWithCommand({ command, region }) {
        const cloudWatchLogsClient = this.getCloudWatchLogsClient(region);
        try {
            const response = await cloudWatchLogsClient.send(command);
            return response;
        } catch (error) {
            logger.error('Error executing CloudWatch Logs command:', error.message);
            
            if (error.name === 'InvalidParameterException') {
                logger.error('Invalid parameter details:', {
                    errorType: error.name,
                    message: error.message,
                    parameters: command.input,
                    metadata: error.$metadata
                });
            }
            
            throw error;
        }
    }

    getCloudWatchLogsClient(region) {
        return new CloudWatchLogsClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 30000
        });
    }
}

export class DescribeLogGroups extends CloudwatchLogsTool {
    constructor() {
        super('DescribeLogGroups', 'Lists the log groups in your account.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupNamePrefix: {
                    type: 'string',
                    description: 'The prefix to filter log groups by name (optional).'
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of log groups to return (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logGroupNamePrefix, limit } = args;
            
            const command = new DescribeLogGroupsCommand({
                logGroupNamePrefix: logGroupNamePrefix,
                limit: limit
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing log groups: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeLogStreams extends CloudwatchLogsTool {
    constructor() {
        super('DescribeLogStreams', 'Lists the log streams for a specified log group.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupName: {
                    type: 'string',
                    description: 'The name of the log group.'
                },
                logStreamNamePrefix: {
                    type: 'string',
                    description: 'The prefix to filter log streams by name (optional).'
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of log streams to return (optional).'
                }
            },
            required: ['logGroupName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logGroupName, logStreamNamePrefix, limit } = args;
            
            const command = new DescribeLogStreamsCommand({
                logGroupName: logGroupName,
                logStreamNamePrefix: logStreamNamePrefix,
                limit: limit
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing log streams: ${error.message}`);
            throw error;
        }
    }
}

export class FilterLogEvents extends CloudwatchLogsTool {
    constructor() {
        super('FilterLogEvents', 'Searches for log events across ALL streams in a log group. Use this when you want to search logs by time range or pattern without knowing specific stream names. This is the preferred method for searching logs.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupName: {
                    type: 'string',
                    description: 'The name of the log group to search in.'
                },
                filterPattern: {
                    type: 'string',
                    description: 'The filter pattern to apply to the log events (optional).'
                },
                startTime: {
                    type: 'number',
                    description: 'The start time of the log events to retrieve (in milliseconds since epoch).'
                },
                endTime: {
                    type: 'number',
                    description: 'The end time of the log events to retrieve (in milliseconds since epoch).'
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of log events to return (optional).'
                }
            },
            required: ['logGroupName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            logger.info('FilterLogEvents called with args:', {
                logGroupName: args.logGroupName,
                filterPattern: args.filterPattern,
                startTime: args.startTime,
                endTime: args.endTime,
                nextToken: args.nextToken,
                limit: args.limit
            });

            const { region, logGroupName, filterPattern, startTime, endTime, limit } = args;
            
            // Ensure log group name starts with a forward slash
            const formattedLogGroupName = logGroupName.startsWith('/') ? logGroupName : `/${logGroupName}`;
            
            // Format the filter pattern using CloudWatch's regex syntax
            const formattedPattern = filterPattern ? this.formatFilterPattern(filterPattern) : filterPattern;
            logger.debug('Using filter pattern:', { 
                original: filterPattern,
                formatted: formattedPattern,
                containsColon: filterPattern?.includes(':'),
                containsSpaces: filterPattern?.includes(' ')
            });

            const command = new FilterLogEventsCommand({
                logGroupName: formattedLogGroupName,
                filterPattern: formattedPattern,
                startTime: startTime,
                endTime: endTime,
                limit: limit
            });

            const response = await this.executeWithCommand({ command, region });
            console.log('FilterLogEvents response:', response);
            
            // Truncate log messages and add console URLs before returning
            return truncateLogLines(response, region, formattedLogGroupName);

        } catch (error) {
            logger.error(`Error filtering log events: ${error.message}`);
            throw error;
        }
    }
}

export class GetLogEvents extends CloudwatchLogsTool {
    constructor() {
        super('GetLogEvents', 'Retrieves log events from a SPECIFIC log stream. Only use this when you know both the log group AND specific stream name. For general log searching, use FilterLogEvents instead.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupName: {
                    type: 'string',
                    description: 'The name of the log group.'
                },
                logStreamName: {
                    type: 'string',
                    description: 'The specific name of the log stream to read from. Required - cannot use wildcards.'
                },
                startFromHead: {
                    type: 'boolean',
                    description: 'Indicates whether to start retrieving log events from the beginning of the log stream (optional).'
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of log events to return (optional).'
                }
            },
            required: ['logGroupName', 'logStreamName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logGroupName, logStreamName, startFromHead, limit } = args;
            
            const command = new GetLogEventsCommand({
                logGroupName: logGroupName,
                logStreamName: logStreamName,
                startFromHead: startFromHead,
                limit: limit
            });
            const response = await this.executeWithCommand({ command, region });
            
            // Truncate log messages and add console URLs before returning
            return truncateLogLines(response, region, logGroupName, logStreamName);

        } catch (error) {
            logger.error(`Error getting log events: ${error.message}`);
            throw error;
        }
    }
}

export class StartQuery extends CloudwatchLogsTool {
    constructor() {
        super('StartQuery', 'Starts a query for log events in the specified log group.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupName: {
                    type: 'string',
                    description: 'The name of the log group.'
                },
                queryString: {
                    type: 'string',
                    description: 'The query string to use for the log events.'
                },
                startTime: {
                    type: 'number',
                    description: 'The start time of the query (in milliseconds since epoch).'
                },
                endTime: {
                    type: 'number',
                    description: 'The end time of the query (in milliseconds since epoch).'
                }
            },
            required: ['logGroupName', 'queryString', 'startTime', 'endTime', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logGroupName, queryString, startTime, endTime } = args;
            
            const command = new StartQueryCommand({
                logGroupName: logGroupName,
                queryString: queryString,
                startTime: startTime,
                endTime: endTime
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error starting query: ${error.message}`);
            throw error;
        }
    }
}

export class GetQueryResults extends CloudwatchLogsTool {
    constructor() {
        super('GetQueryResults', 'Retrieves the results of a query that was started using StartQuery.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                queryId: {
                    type: 'string',
                    description: 'The ID of the query.'
                }
            },
            required: ['queryId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, queryId } = args;
            
            const command = new GetQueryResultsCommand({
                QueryId: queryId
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting query results: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeQueries extends CloudwatchLogsTool {
    constructor() {
        super('DescribeQueries', 'Lists the queries that are currently running or have been run in the specified log group.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logGroupName: {
                    type: 'string',
                    description: 'The name of the log group.'
                },
                status: {
                    type: 'string',
                    description: 'The status of the queries to filter by (optional).'
                },
                limit: {
                    type: 'number',
                    description: 'The maximum number of queries to return (optional).'
                }
            },
            required: ['logGroupName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logGroupName, status, limit } = args;
            
            const command = new DescribeQueriesCommand({
                logGroupName: logGroupName,
                status: status,
                limit: limit
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing queries: ${error.message}`);
            throw error;
        }
    }
}

export class GetLogRecord extends CloudwatchLogsTool {
    constructor() {
        super('GetLogRecord', 'Retrieves a log record from the specified log group.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                logRecordPointer: {
                    type: 'string',
                    description: 'The pointer to the log record.'
                }
            },
            required: ['logRecordPointer', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, logRecordPointer } = args;
            
            const command = new GetLogRecordCommand({
                logRecordPointer: logRecordPointer
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting log record: ${error.message}`);
            throw error;
        }
    }
}

export class ListTagsForCloudwatchResource extends CloudwatchLogsTool {
    constructor() {
        super('ListTagsForCloudwatchResource', 'Lists the tags for a specified resource.', {
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
                resourceArn: resourceArn
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing tags: ${error.message}`);
            throw error;
        }
    }
}

export const cloudwatchLogsTools = {
    DescribeLogGroups,
    DescribeLogStreams,
    FilterLogEvents,
    GetLogEvents,
    StartQuery,
    GetQueryResults,
    DescribeQueries,
    GetLogRecord,
    ListTagsForCloudwatchResource,
}; 