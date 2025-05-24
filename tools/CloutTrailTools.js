import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();
import {
    CloudTrailClient,
    DescribeQueryCommand,
    DescribeTrailsCommand,
    GenerateQueryCommand,
    GetChannelCommand,
    GetEventDataStoreCommand,
    GetQueryResultsCommand,
    ListEventDataStoresCommand,
    ListInsightsMetricDataCommand,
    ListQueriesCommand,
    LookupEventsCommand,
    SearchSampleQueriesCommand,
    GetInsightSelectorsCommand
} from "@aws-sdk/client-cloudtrail";

class CloudTrailTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const cloudTrailClient = this.getCloudTrailClient(region);
        try {
            const response = await cloudTrailClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing CloudTrail command: ${error.message}`);
            throw error;
        }
    }

    getCloudTrailClient(region) {
        return new CloudTrailClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class GetInsightSelectors extends CloudTrailTool {
    constructor() {
        super('GetInsightSelectors', 'Describes the settings for the Insights event selectors configured for a trail or event data store.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                TrailName: {
                    type: 'string',
                    description: 'The name of the trail or trail ARN. Must meet specific naming requirements if a name is provided.'
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The ARN or ID suffix of the ARN of the event data store for which to get Insights selectors.'
                },
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, TrailName, EventDataStore } = args;
            
            // Validate input: Either TrailName or EventDataStore must be provided, but not both
            if ((TrailName && EventDataStore) || (!TrailName && !EventDataStore)) {
                throw new Error('You must specify either TrailName or EventDataStore, but not both.');
            }

            const input = {};
            if (TrailName) input.TrailName = TrailName;
            if (EventDataStore) input.EventDataStore = EventDataStore;

            const command = new GetInsightSelectorsCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error retrieving Insight selectors: ${error.message}`);
            throw error;
        }
    }
}

export class SearchSampleQueries extends CloudTrailTool {
    constructor() {
        super('SearchSampleQueries', 'Searches sample queries and returns a list of sample queries sorted by relevance.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                SearchPhrase: {
                    type: 'string',
                    description: 'The natural language phrase in English to use for the semantic search.'
                },
                MaxResults: {
                    type: 'integer',
                    description: 'The maximum number of results to return on a single page. Default is 10.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of results.'
                },
            },
            required: ['region', 'SearchPhrase']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, SearchPhrase, MaxResults, NextToken } = args;
            
            // Validate input: SearchPhrase is required
            if (!SearchPhrase) {
                throw new Error('SearchPhrase must be specified.');
            }

            const input = {
                SearchPhrase
            };
            if (MaxResults) input.MaxResults = MaxResults;
            if (NextToken) input.NextToken = NextToken;

            const command = new SearchSampleQueriesCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error searching sample queries: ${error.message}`);
            throw error;
        }
    }
}

export class LookupCloudTrailEvents extends CloudTrailTool {
    constructor() {
      super('LookupCloudTrailEvents', 'Looks up management or CloudTrail Insights events captured by CloudTrail.', {
        type: 'object',
        properties: {
          region: { 
              type: 'string', 
              description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
              default: 'ca-central-1' 
          },
          LookupAttributes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                AttributeKey: {
                  type: 'string',
                  description: 'The attribute key to filter events. Valid options: EventId, EventName, ReadOnly, Username, ResourceType, ResourceName, EventSource, AccessKeyId'
                },
                AttributeValue: {
                  type: 'string',
                  description: 'The attribute value to filter events.'
                }
              },
              required: ['AttributeKey', 'AttributeValue']
            },
            description: 'A list of lookup attributes. In many contexts, only one item can be used at once, though the SDK can theoretically accept multiple.'
          },
          StartTime: {
            type: 'string',
            format: 'date-time',
            description: 'Specifies that only events that occur after or at the specified time are returned. ISO 8601 format.'
          },
          EndTime: {
            type: 'string',
            format: 'date-time',
            description: 'Specifies that only events that occur before or at the specified time are returned. ISO 8601 format.'
          },
          EventCategory: {
            type: 'string',
            description: 'Specifies the event category. If set to "insight", only Insights events are returned; if set to "management", only management events are returned.'
          },
          MaxResults: {
            type: 'integer',
            description: 'The number of events to return. Possible values are 1 through 50. Default is 50.'
          },
          NextToken: {
            type: 'string',
            description: 'A token to retrieve the next page of results.'
          },
        },
        // No longer require EventDataStore. 
        required: ['region']
      });
    }
  
    async call(id, args, context, streamManager, user) {
      try {
        const {
          region,
          LookupAttributes,
          StartTime,
          EndTime,
          EventCategory,
          MaxResults,
          NextToken
        } = args;
  
        // Validate enum values for AttributeKey
        const validAttributeKeys = [
          'EventId',
          'EventName',
          'ReadOnly',
          'Username',
          'ResourceType',
          'ResourceName',
          'EventSource',
          'AccessKeyId'
        ];
  
        if (LookupAttributes) {
          LookupAttributes.forEach(attr => {
            if (!validAttributeKeys.includes(attr.AttributeKey)) {
              throw new Error(
                `Invalid AttributeKey: ${attr.AttributeKey}. Must be one of: ${validAttributeKeys.join(', ')}`
              );
            }
          });
        }
  
        // Build input object
        const input = {};
        if (LookupAttributes && LookupAttributes.length > 0) {
          input.LookupAttributes = LookupAttributes;
        }
        if (StartTime) {
          input.StartTime = new Date(StartTime);
        }
        if (EndTime) {
          input.EndTime = new Date(EndTime);
        }
        if (EventCategory) {
          // e.g. 'management' or 'insight'
          input.EventCategory = EventCategory;
        }
        if (MaxResults) {
          input.MaxResults = MaxResults;
        }
        if (NextToken) {
          input.NextToken = NextToken;
        }
  
        // Use the LookupEventsCommand (for the free 90-day event history)
        const command = new LookupEventsCommand(input);
        const response = await this.executeWithCommand({ command, region });
  
        return response;
  
      } catch (error) {
        logger.error(`Error looking up events: ${error.message}`);
        throw error;
      }
    }
  }

export class ListInsightsMetricData extends CloudTrailTool {
    constructor() {
        super('ListInsightsMetricData', 'Returns Insights metrics data for trails that have enabled Insights.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                EventSource: {
                    type: 'string',
                    description: 'The AWS service to which the request was made, such as iam.amazonaws.com or s3.amazonaws.com.'
                },
                EventName: {
                    type: 'string',
                    description: 'The name of the event, typically the AWS API on which unusual levels of activity were recorded.'
                },
                InsightType: {
                    type: 'string',
                    description: 'The type of CloudTrail Insights event, either ApiCallRateInsight or ApiErrorRateInsight.'
                },
                ErrorCode: {
                    type: 'string',
                    description: 'The error to retrieve data for. Required if InsightType is ApiErrorRateInsight.'
                },
                StartTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The start time for time-series data in UTC. Inclusive. Defaults to 90 days before the time of request.'
                },
                EndTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The end time for time-series data in UTC. Exclusive. Defaults to the time of request.'
                },
                Period: {
                    type: 'integer',
                    description: 'Granularity of data to retrieve, in seconds. Valid values are 60, 300, and 3600.'
                },
                DataType: {
                    type: 'string',
                    description: 'Type of data points to return. Defaults to NonZeroData.'
                },
                MaxResults: {
                    type: 'integer',
                    description: 'The maximum number of data points to return. Valid values are integers from 1 to 21600.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of query results.'
                },
            },
            required: ['region', 'EventSource', 'EventName', 'InsightType']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, EventSource, EventName, InsightType, ErrorCode, StartTime, EndTime, Period, DataType, MaxResults, NextToken } = args;
            
            // Validate input: ErrorCode is required if InsightType is ApiErrorRateInsight
            if (InsightType === 'ApiErrorRateInsight' && !ErrorCode) {
                throw new Error('ErrorCode must be specified when InsightType is ApiErrorRateInsight.');
            }

            // Validate enum values
            const validInsightTypes = ['ApiCallRateInsight', 'ApiErrorRateInsight'];
            if (!validInsightTypes.includes(InsightType)) {
                throw new Error(`Invalid InsightType: ${InsightType}. Must be one of: ${validInsightTypes.join(', ')}`);
            }

            const input = {
                EventSource,
                EventName,
                InsightType
            };
            if (ErrorCode) input.ErrorCode = ErrorCode;
            if (StartTime) input.StartTime = new Date(StartTime);
            if (EndTime) input.EndTime = new Date(EndTime);
            if (Period) input.Period = Period;
            if (DataType) input.DataType = DataType;
            if (MaxResults) input.MaxResults = MaxResults;
            if (NextToken) input.NextToken = NextToken;

            const command = new ListInsightsMetricDataCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error listing Insights metric data: ${error.message}`);
            throw error;
        }
    }
}

export class ListQueries extends CloudTrailTool {
    constructor() {
        super('ListQueries', 'Returns a list of queries and query statuses for the past seven days.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The ARN or the ID suffix of the ARN of an event data store on which queries were run.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of results.'
                },
                MaxResults: {
                    type: 'integer',
                    description: 'The maximum number of queries to show on a page.'
                },
                StartTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The start time for the query list in UTC. Inclusive. Optional.'
                },
                EndTime: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The end time for the query list in UTC. Exclusive. Optional.'
                },
                QueryStatus: {
                    type: 'string',
                    enum: ['QUEUED', 'RUNNING', 'FINISHED', 'FAILED', 'TIMED_OUT', 'CANCELLED'],
                    description: 'The status of queries to return in results.'
                },
            },
            required: ['region', 'EventDataStore']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, EventDataStore, NextToken, MaxResults, StartTime, EndTime, QueryStatus } = args;
            
            // Validate input: EventDataStore is required
            if (!EventDataStore) {
                throw new Error('EventDataStore must be specified.');
            }

            const input = {
                EventDataStore
            };
            if (NextToken) input.NextToken = NextToken;
            if (MaxResults) input.MaxResults = MaxResults;
            if (StartTime) input.StartTime = new Date(StartTime);
            if (EndTime) input.EndTime = new Date(EndTime);
            if (QueryStatus) input.QueryStatus = QueryStatus;

            const command = new ListQueriesCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error listing queries: ${error.message}`);
            throw error;
        }
    }
}

export class ListEventDataStores extends CloudTrailTool {
    constructor() {
        super('ListEventDataStores', 'Returns information about all event data stores in the account and current Region.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                MaxResults: {
                    type: 'number',
                    description: 'The maximum number of event data stores to display on a single page.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of event data store results.'
                },
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, MaxResults, NextToken } = args;
            
            const input = {};
            if (MaxResults) input.MaxResults = MaxResults;
            if (NextToken) input.NextToken = NextToken;

            const command = new ListEventDataStoresCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error listing event data stores: ${error.message}`);
            throw error;
        }
    }
}

export class GetCloudTrailQueryResults extends CloudTrailTool {
    constructor() {
        super('GetCloudTrailQueryResults', 'Retrieves the event data results of a specific CloudTrail query.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                QueryId: {
                    type: 'string',
                    description: 'The ID of the query to retrieve results for.'
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The name or ARN of the event data store.'
                },
                EventDataStoreOwnerAccountId: {
                    type: 'string',
                    description: 'The AWS account ID of the event data store owner.'
                },
                MaxResults: {
                    type: 'integer',
                    description: 'The maximum number of results to return.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of results.'
                },
            },
            required: ['region', 'QueryId']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, QueryId, EventDataStore, EventDataStoreOwnerAccountId, MaxResults, NextToken } = args;
            
            const input = {
                QueryId
            };
            if (EventDataStore) input.EventDataStore = EventDataStore;
            if (EventDataStoreOwnerAccountId) input.EventDataStoreOwnerAccountId = EventDataStoreOwnerAccountId;
            if (MaxResults) input.MaxResults = MaxResults;
            if (NextToken) input.NextToken = NextToken;

            const command = new GetQueryResultsCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error retrieving query results: ${error.message}`);
            throw error;
        }
    }
}

export class ListCloudTrailQueries extends CloudTrailTool {
    constructor() {
        super('ListCloudTrailQueries', 'Returns a list of queries and query statuses for the past seven days.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The name or ARN of the event data store.'
                },
                EventDataStoreOwnerAccountId: {
                    type: 'string',
                    description: 'The AWS account ID of the event data store owner.'
                },
                MaxResults: {
                    type: 'integer',
                    description: 'The maximum number of results to return.'
                },
                NextToken: {
                    type: 'string',
                    description: 'A token to retrieve the next page of results.'
                },
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, EventDataStore, EventDataStoreOwnerAccountId, MaxResults, NextToken } = args;
            
            const input = {};
            if (EventDataStore) input.EventDataStore = EventDataStore;
            if (EventDataStoreOwnerAccountId) input.EventDataStoreOwnerAccountId = EventDataStoreOwnerAccountId;
            if (MaxResults) input.MaxResults = MaxResults;
            if (NextToken) input.NextToken = NextToken;

            const command = new ListQueriesCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error listing queries: ${error.message}`);
            throw error;
        }
    }
}

export class GetEventDataStore extends CloudTrailTool {
    constructor() {
        super('GetEventDataStore', 'Returns information about a specific CloudTrail event data store.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The ARN or ID suffix of the event data store to retrieve information for.'
                },
            },
            required: ['region', 'EventDataStore']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, EventDataStore } = args;
            
            // Validate input: EventDataStore is required
            if (!EventDataStore) {
                throw new Error('EventDataStore must be specified.');
            }

            const input = { EventDataStore };

            const command = new GetEventDataStoreCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error retrieving event data store: ${error.message}`);
            throw error;
        }
    }
}

export class GetChannel extends CloudTrailTool {
    constructor() {
        super('GetChannel', 'Returns information about a specific CloudTrail channel.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                Channel: {
                    type: 'string',
                    description: 'The ARN or UUID of a channel.'
                },
            },
            required: ['region', 'Channel']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, Channel } = args;
            
            // Validate input: Channel is required
            if (!Channel) {
                throw new Error('Channel must be specified.');
            }

            const input = { Channel };

            const command = new GetChannelCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error getting channel: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeQuery extends CloudTrailTool {
    constructor() {
        super('DescribeQuery', 'Returns metadata about a CloudTrail Lake query, including runtime, events scanned/matched, status, and delivery information if results are stored in S3.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                QueryId: {
                    type: 'string',
                    description: 'The ID of the query to describe.'
                },
                QueryAlias: {
                    type: 'string',
                    description: 'The alias of the query template. Returns information about the last query run for this alias.'
                },
                RefreshId: {
                    type: 'string',
                    description: 'The ID of the dashboard refresh. Use with QueryAlias to view specific dashboard query results.'
                },
                EventDataStore: {
                    type: 'string',
                    description: 'The name or ARN of the event data store.'
                },
                EventDataStoreOwnerAccountId: {
                    type: 'string',
                    description: 'The AWS account ID of the event data store owner.'
                },
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, QueryId, QueryAlias, RefreshId, EventDataStore, EventDataStoreOwnerAccountId } = args;
            
            // Validate input: either QueryId or QueryAlias must be provided
            if (!QueryId && !QueryAlias) {
                throw new Error('Either QueryId or QueryAlias must be specified.');
            }

            const input = {};
            if (QueryId) input.QueryId = QueryId;
            if (QueryAlias) input.QueryAlias = QueryAlias;
            if (RefreshId) input.RefreshId = RefreshId;
            if (EventDataStore) input.EventDataStore = EventDataStore;
            if (EventDataStoreOwnerAccountId) input.EventDataStoreOwnerAccountId = EventDataStoreOwnerAccountId;

            const command = new DescribeQueryCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error describing query: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeCloudTrailTrails extends CloudTrailTool {
    constructor() {
        super('DescribeCloudTrailTrails', 'Retrieves settings for one or more CloudTrail trails associated with the current Region for your account.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                trailNameList: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'A list of trail names or ARNs to describe. If empty, information for all trails in the current Region is returned.'
                },
                includeShadowTrails: {
                    type: 'boolean',
                    description: 'Specifies whether to include shadow trails in the response. Default is true.',
                    default: true
                },
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, trailNameList, includeShadowTrails } = args;
            
            const input = {};
            if (trailNameList && trailNameList.length > 0) {
                input.trailNameList = trailNameList;
            }
            if (typeof includeShadowTrails === 'boolean') {
                input.includeShadowTrails = includeShadowTrails;
            }

            const command = new DescribeTrailsCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error describing trails: ${error.message}`);
            throw error;
        }
    }
}

export class GenerateQuery extends CloudTrailTool {
    constructor() {
        super('GenerateQuery', 'Generates a SQL query from a natural language prompt using generative AI, tailored for querying event data in CloudTrail Lake.', {
            type: 'object',
            properties: {
                region: { 
                    type: 'string', 
                    description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', 
                    default: 'ca-central-1' 
                },
                EventDataStores: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    description: 'The ARN (or ID suffix of the ARN) of the event data store to query. Only one event data store can be specified.',
                    minItems: 1
                },
                Prompt: {
                    type: 'string',
                    description: 'The natural language prompt in English to generate the SQL query.',
                },
            },
            required: ['region', 'EventDataStores', 'Prompt']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, EventDataStores, Prompt } = args;
            
            // Validate input: EventDataStores and Prompt are required
            if (!EventDataStores || EventDataStores.length === 0) {
                throw new Error('EventDataStores must be a non-empty array.');
            }
            if (!Prompt) {
                throw new Error('Prompt must be specified.');
            }

            const input = {
                EventDataStores: EventDataStores,
                Prompt: Prompt
            };

            const command = new GenerateQueryCommand(input);
            const response = await this.executeWithCommand({ command, region });

            return response;

        } catch (error) {
            logger.error(`Error generating query: ${error.message}`);
            throw error;
        }
    }
}

export const cloudtrailTools = {
    // DescribeQuery,
    DescribeCloudTrailTrails,
    // GenerateQuery,
    // GetChannel,
    // GetEventDataStore,
    // GetCloudTrailQueryResults,
    // ListEventDataStores,
    // ListInsightsMetricData,
    // ListCloudTrailQueries,
    LookupCloudTrailEvents
};