import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

dotenv.config();

import {
  ECSClient,
  ListClustersCommand,
  DescribeClustersCommand,
  ListServicesCommand,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  DescribeTaskDefinitionCommand,
  DescribeContainerInstancesCommand,
  ListTagsForResourceCommand,
  DescribeCapacityProvidersCommand,
} from "@aws-sdk/client-ecs";

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

// Simplified ECSTool base class
class ECSTool extends Tool {
  constructor(name, description, parameters) {
    super(name, description, parameters);
  }

  async executeWithCommand({ command, account, region }) {
    const ecsClient = this.getEcsClient(account, region);
    try {
      const response = await ecsClient.send(command);
      return response;
    } catch (error) {
      logger.error(`Error executing ECS command: ${error.message}`);
      throw error;
    }
  }

  getEcsClient(account, region) {
    const validAccounts = Object.keys(accountCredentials);
    if (!validAccounts.includes(account)) {
      throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
    }

    const credentials = accountCredentials[account];
    if (!credentials) {
      throw new Error(`No credentials found for account: ${account}`);
    }

    return new ECSClient({
      region: region || defaultRegion,
      credentials,
      maxAttempts: 3,
      requestTimeout: 5000
    });
  }
}

const account = { type: 'string', description: 'The AWS account to list clusters in. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

/**
 * Lists all ECS clusters in the account.
 */
export class ListClusters extends ECSTool {
  constructor() {
    super('ListClusters', 'Lists all ECS clusters in the account.', {
      type: 'object',
      properties: {
        account,
        region,
        maxResults: {
          type: 'number',
          description: 'Maximum number of clusters to return (optional).'
        },
        nextToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, maxResults, nextToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing ECS clusters in ${account}/${region}...`
      });

      let allClusters = [];
      let currentToken = nextToken;

      do {
        const command = new ListClustersCommand({
          maxResults,
          nextToken: currentToken
        });

        const response = await this.executeWithCommand({ command, account, region });
        allClusters = allClusters.concat(response.clusterArns || []);
        currentToken = response.nextToken;

        // Emit progress
        user.emit('tool.output.chunk', {
          object: 'tool.output.chunk',
          toolCallId: id,
          data: `Found ${allClusters.length} clusters so far...`
        });

      } while (currentToken);

      return {
        clusters: allClusters,
        nextToken: currentToken
      };

    } catch (error) {
      logger.error(`Error listing ECS clusters: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Retrieves detailed information about ECS clusters.
 */
export class DescribeClusters extends ECSTool {
  constructor() {
    super('DescribeClusters', 'Retrieves detailed information about ECS clusters by ARN', {
      type: 'object',
      properties: {
        account,
        region,
        clusters: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of cluster names or ARNs to describe.'
        }
      },
      required: ['clusters', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, clusters } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS clusters in ${account}/${region}...`
      });

      const command = new DescribeClustersCommand({ clusters });
      const response = await this.executeWithCommand({ command, account, region });

      return {
        clusters: response.clusters,
        failures: response.failures
      };

    } catch (error) {
      logger.error(`Error describing clusters: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Lists services running in a specific ECS cluster.
 */
export class ListServices extends ECSTool {
  constructor() {
    super('ListServices', 'Lists services in an ECS cluster', {
      type: 'object',
      properties: {
        account,
        region,
        cluster: {
          type: 'string',
          description: 'The ECS cluster name or ARN'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of services to return (optional)'
        },
        nextToken: {
          type: 'string',
          description: 'Token for the next page of results (optional)'
        }
      },
      required: ['account', 'region', 'cluster']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, cluster, maxResults, nextToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing ECS services in cluster ${cluster}...`
      });

      let allServices = [];
      let currentToken = nextToken;

      do {
        const command = new ListServicesCommand({
          cluster,
          maxResults,
          nextToken: currentToken
        });

        const response = await this.executeWithCommand({ command, account, region });
        allServices = allServices.concat(response.serviceArns || []);
        currentToken = response.nextToken;

        // Emit progress
        user.emit('tool.output.chunk', {
          object: 'tool.output.chunk',
          toolCallId: id,
          data: `Found ${allServices.length} services so far...`
        });

      } while (currentToken);

      return {
        services: allServices,
        nextToken: currentToken
      };

    } catch (error) {
      logger.error(`Error listing ECS services: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Returns detailed information about specified ECS services.
 */
export class DescribeServices extends ECSTool {
  constructor() {
    super('DescribeServices', 'Returns detailed information about specified ECS services', {
      type: 'object',
      properties: {
        account,
        region,
        cluster: { type: 'string', description: 'The cluster name or ARN.' },
        services: { type: 'array', items: { type: 'string' }, description: 'List of service names or ARNs to describe.' }
      },
      required: ['cluster', 'services', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, cluster, services } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS services in cluster ${cluster}...`
      });

      const command = new DescribeServicesCommand({ cluster, services, include: ['TAGS'] });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing services: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Lists tasks running or stopped in a cluster.
 */
export class ListTasks extends ECSTool {
  constructor() {
    super('ListTasks', 'Lists tasks running or stopped in a cluster', {
      type: 'object',
      properties: {
        account,
        region,
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        serviceName: { type: 'string', description: 'The service name to filter tasks' },
        desiredStatus: { type: 'string', description: 'Filter by task status (RUNNING, STOPPED)' }
      },
      required: ['cluster', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, cluster, serviceName, desiredStatus } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing ECS tasks in cluster ${cluster}...`
      });

      const command = new ListTasksCommand({ cluster, serviceName, desiredStatus });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing tasks: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Retrieves detailed information about specified tasks.
 */
export class DescribeTasks extends ECSTool {
  constructor() {
    super('DescribeTasks', 'Retrieves detailed information about specified tasks', {
      type: 'object',
      properties: {
        account,
        region,
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        tasks: { type: 'array', items: { type: 'string' }, description: 'List of task IDs or ARNs to describe' }
      },
      required: ['cluster', 'tasks', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, cluster, tasks } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS tasks in cluster ${cluster}...`
      });

      const command = new DescribeTasksCommand({ cluster, tasks });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing tasks: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Provides details on a task definition.
 */
export class DescribeTaskDefinition extends ECSTool {
  constructor() {
    super('DescribeTaskDefinition', 'Provides details on a task definition', {
      type: 'object',
      properties: {
        account,
        region,
        taskDefinition: { type: 'string', description: 'The task definition name or ARN' }
      },
      required: ['taskDefinition', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, taskDefinition } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS task definition ${taskDefinition} in ${account}/${region}...`
      });

      const command = new DescribeTaskDefinitionCommand({ taskDefinition });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing task definition: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Describes container instances within a cluster.
 */
export class DescribeContainerInstances extends ECSTool {
  constructor() {
    super('DescribeContainerInstances', 'Describes container instances within a cluster', {
      type: 'object',
      properties: {
        account,
        region,
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        containerInstances: { type: 'array', items: { type: 'string' }, description: 'List of container instance IDs or ARNs' }
      },
      required: ['cluster', 'containerInstances', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, cluster, containerInstances } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS container instances in cluster ${cluster}...`
      });

      const command = new DescribeContainerInstancesCommand({ cluster, containerInstances });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing container instances: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Lists tags for a specified ECS resource.
 */
export class ListTagsForEcsResource extends ECSTool {
  constructor() {
    super('ListTagsForEcsResource', 'Lists tags for a specified ECS resource', {
      type: 'object',
      properties: {
        account,
        region,
        resourceArn: { type: 'string', description: 'The ARN of the resource to list tags for' }
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
        data: `Listing ECS tags for resource ${resourceArn}...`
      });

      const command = new ListTagsForResourceCommand({ resourceArn });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing resource tags: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

/**
 * Provides details about capacity providers linked to clusters.
 */
export class DescribeCapacityProviders extends ECSTool {
  constructor() {
    super('DescribeCapacityProviders', 'Provides details about capacity providers linked to clusters', {
      type: 'object',
      properties: {
        account,
        region,
        capacityProviders: { type: 'array', items: { type: 'string' }, description: 'Names of the capacity providers to describe' }
      },
      required: ['capacityProviders', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, capacityProviders } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Describing ECS capacity providers in ${account}/${region}...`
      });

      const command = new DescribeCapacityProvidersCommand({ capacityProviders });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing capacity providers: ${error.message}`);
      user.emit('tool.error', {
        object: 'tool.error',
        toolCallId: id,
        data: error.message
      });
      throw error;
    }
  }
}

// Export all tools as named exports for consistency
export const ecsTools = {
  ListClusters,
  DescribeClusters,
  ListServices,
  DescribeServices,
  ListTasks,
  DescribeTasks,
  DescribeTaskDefinition,
  DescribeContainerInstances,
  ListTagsForEcsResource,
  DescribeCapacityProviders,
};