import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

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

// Simplified ECSTool base class
class ECSTool extends Tool {
  constructor(name, description, parameters) {
    super(name, description, parameters);
  }

  async executeWithCommand({ command, region }) {
    const ecsClient = this.getEcsClient(region);
    try {
      const response = await ecsClient.send(command);
      return response;
    } catch (error) {
      logger.error(`Error executing ECS command: ${error.message}`);
      throw error;
    }
  }

  getEcsClient(region) {
    return new ECSClient({
      region: region || process.env.AWS_DEFAULT_REGION,
      maxAttempts: 3,
      requestTimeout: 5000
    });
  }
}

/**
 * Lists all ECS clusters in the account.
 */
export class ListClusters extends ECSTool {
  constructor() {
    super('ListClusters', 'Lists all ECS clusters in the account.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        maxResults: {
          type: 'number',
          description: 'Maximum number of clusters to return (optional).'
        },
        nextToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, maxResults, nextToken } = args;
      
      let allClusters = [];
      let currentToken = nextToken;

      do {
        const command = new ListClustersCommand({
          maxResults,
          nextToken: currentToken
        });

        const response = await this.executeWithCommand({ command, region });
        allClusters = allClusters.concat(response.clusterArns || []);
        currentToken = response.nextToken;

      } while (currentToken);

      return {
        clusters: allClusters,
        nextToken: currentToken
      };

    } catch (error) {
      logger.error(`Error listing ECS clusters: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        clusters: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of cluster names or ARNs to describe.'
        }
      },
      required: ['clusters', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, clusters } = args;
      
      const command = new DescribeClustersCommand({ clusters });
      const response = await this.executeWithCommand({ command, region });

      return {
        clusters: response.clusters,
        failures: response.failures
      };

    } catch (error) {
      logger.error(`Error describing clusters: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
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
      required: ['region', 'cluster']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, cluster, maxResults, nextToken } = args;
      
      let allServices = [];
      let currentToken = nextToken;

      do {
        const command = new ListServicesCommand({
          cluster,
          maxResults,
          nextToken: currentToken
        });

        const response = await this.executeWithCommand({ command, region });
        allServices = allServices.concat(response.serviceArns || []);
        currentToken = response.nextToken;

      } while (currentToken);

      return {
        services: allServices,
        nextToken: currentToken
      };

    } catch (error) {
      logger.error(`Error listing ECS services: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        cluster: { type: 'string', description: 'The cluster name or ARN.' },
        services: { type: 'array', items: { type: 'string' }, description: 'List of service names or ARNs to describe.' }
      },
      required: ['cluster', 'services', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, cluster, services } = args;
      
      const command = new DescribeServicesCommand({ cluster, services, include: ['TAGS'] });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing services: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        serviceName: { type: 'string', description: 'The service name to filter tasks' },
        desiredStatus: { type: 'string', description: 'Filter by task status (RUNNING, STOPPED)' }
      },
      required: ['cluster', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, cluster, serviceName, desiredStatus } = args;
      
      const command = new ListTasksCommand({ cluster, serviceName, desiredStatus });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing tasks: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        tasks: { type: 'array', items: { type: 'string' }, description: 'List of task IDs or ARNs to describe' }
      },
      required: ['cluster', 'tasks', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, cluster, tasks } = args;
      
      const command = new DescribeTasksCommand({ cluster, tasks });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing tasks: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        taskDefinition: { type: 'string', description: 'The task definition name or ARN' }
      },
      required: ['taskDefinition', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, taskDefinition } = args;
      
      const command = new DescribeTaskDefinitionCommand({ taskDefinition });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing task definition: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        cluster: { type: 'string', description: 'The cluster name or ARN' },
        containerInstances: { type: 'array', items: { type: 'string' }, description: 'List of container instance IDs or ARNs' }
      },
      required: ['cluster', 'containerInstances', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, cluster, containerInstances } = args;
      
      const command = new DescribeContainerInstancesCommand({ cluster, containerInstances });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing container instances: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        resourceArn: { type: 'string', description: 'The ARN of the resource to list tags for' }
      },
      required: ['resourceArn', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, resourceArn } = args;
      
      const command = new ListTagsForResourceCommand({ resourceArn });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing resource tags: ${error.message}`);
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
        region: { type: 'string', description: 'The AWS region to list clusters in. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        capacityProviders: { type: 'array', items: { type: 'string' }, description: 'Names of the capacity providers to describe' }
      },
      required: ['capacityProviders', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, capacityProviders } = args;
      
      const command = new DescribeCapacityProvidersCommand({ capacityProviders });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error describing capacity providers: ${error.message}`);
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