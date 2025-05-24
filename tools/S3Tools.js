import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
  S3Client,
  GetBucketAccelerateConfigurationCommand,
  GetBucketAclCommand,
  GetBucketAnalyticsConfigurationCommand,
  GetBucketCorsCommand,
  GetBucketEncryptionCommand,
  GetBucketIntelligentTieringConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLocationCommand,
  GetBucketLoggingCommand,
  GetBucketMetricsConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketOwnershipControlsCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketReplicationCommand,
  GetBucketRequestPaymentCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetBucketWebsiteCommand,
  GetPublicAccessBlockCommand,
  ListBucketAnalyticsConfigurationsCommand,
  ListBucketIntelligentTieringConfigurationsCommand,
  ListBucketInventoryConfigurationsCommand,
  ListBucketMetricsConfigurationsCommand,
  ListBucketsCommand,
  ListObjectVersionsCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListPartsCommand,
} from "@aws-sdk/client-s3";

const getS3Client = (region) => {
  return new S3Client({
    region: region || process.env.AWS_DEFAULT_REGION,
    maxAttempts: 3,
    requestTimeout: 5000
  });
};

class S3Tool extends Tool {
  constructor(name, description, parameters) {
    super(name, description, parameters);
  }

  async executeWithCommand({ command, region }) {
    const s3Client = getS3Client(region);
    try {
      const response = await s3Client.send(command);
      return response;
    } catch (error) {
      logger.error(`Error executing S3 command: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the Transfer Acceleration state of a specified S3 bucket.
 */
export class GetBucketAccelerateConfiguration extends S3Tool {
  constructor() {
    super('GetBucketAccelerateConfiguration', 'Retrieves the Transfer Acceleration state of a specified Amazon S3 bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket acceleration config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns a list of all buckets owned by the authenticated sender of the request.
 */
export class ListBuckets extends S3Tool {
  constructor() {
    super('ListBuckets', 'Returns a list of all buckets owned by the authenticated sender of the request.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
      },
      required: ['region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region } = args;
      
      const command = new ListBucketsCommand({});
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing buckets: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the Access Control List (ACL) of a specified S3 bucket.
 */
export class GetBucketAcl extends S3Tool {
  constructor() {
    super('GetBucketAcl', 'Returns the Access Control List (ACL) of a specified S3 bucket, detailing the permissions granted on the bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketAclCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket ACL: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves an analytics configuration from the specified bucket.
 */
export class GetBucketAnalyticsConfiguration extends S3Tool {
  constructor() {
    super('GetBucketAnalyticsConfiguration', 'Retrieves an analytics configuration from the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID that identifies the analytics configuration.'
        }
      },
      required: ['bucketName', 'id', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, id: configId } = args;
      
      const command = new GetBucketAnalyticsConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket analytics config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the Cross-Origin Resource Sharing (CORS) configuration of a bucket.
 */
export class GetBucketCors extends S3Tool {
  constructor() {
    super('GetBucketCors', 'Returns the CORS configuration of a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketCorsCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket CORS config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the default encryption configuration for a specified S3 bucket.
 */
export class GetBucketEncryption extends S3Tool {
  constructor() {
    super('GetBucketEncryption', 'Retrieves the default encryption configuration for a specified S3 bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket encryption: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the S3 Intelligent-Tiering configuration from the specified bucket.
 */
export class GetBucketIntelligentTieringConfiguration extends S3Tool {
  constructor() {
    super('GetBucketIntelligentTieringConfiguration', 'Retrieves the S3 Intelligent-Tiering configuration from the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID used to identify the Intelligent-Tiering configuration.'
        }
      },
      required: ['bucketName', 'id', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, id: configId } = args;
      
      const command = new GetBucketIntelligentTieringConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket Intelligent-Tiering config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns an inventory configuration from the specified bucket.
 */
export class GetBucketInventoryConfiguration extends S3Tool {
  constructor() {
    super('GetBucketInventoryConfiguration', 'Returns an inventory configuration from the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID that identifies the inventory configuration.'
        }
      },
      required: ['bucketName', 'id', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, id: configId } = args;
      
      const command = new GetBucketInventoryConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket inventory config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the lifecycle configuration of a bucket.
 */
export class GetBucketLifecycleConfiguration extends S3Tool {
  constructor() {
    super('GetBucketLifecycleConfiguration', 'Returns the lifecycle configuration of a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket lifecycle config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the AWS Region where the specified bucket resides.
 */
export class GetBucketLocation extends S3Tool {
  constructor() {
    super('GetBucketLocation', 'Returns the AWS Region where the specified bucket resides.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { bucketName } = args;
      
      const command = new GetBucketLocationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region: undefined });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket location: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the logging status of a bucket.
 */
export class GetBucketLogging extends S3Tool {
  constructor() {
    super('GetBucketLogging', 'Returns the logging status of a bucket and the permissions users have to view and modify that status.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketLoggingCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket logging: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns a metrics configuration from the specified bucket.
 */
export class GetBucketMetricsConfiguration extends S3Tool {
  constructor() {
    super('GetBucketMetricsConfiguration', 'Returns a metrics configuration from the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID used to identify the metrics configuration.'
        }
      },
      required: ['bucketName', 'id', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, id: configId } = args;
      
      const command = new GetBucketMetricsConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket metrics config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the notification configuration of a bucket.
 */
export class GetBucketNotificationConfiguration extends S3Tool {
  constructor() {
    super('GetBucketNotificationConfiguration', 'Returns the notification configuration of a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketNotificationConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket notification config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves OwnershipControls for an S3 bucket.
 */
export class GetBucketOwnershipControls extends S3Tool {
  constructor() {
    super('GetBucketOwnershipControls', 'Retrieves OwnershipControls for an S3 bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketOwnershipControlsCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket ownership controls: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the access policy of a specified bucket.
 */
export class GetBucketPolicy extends S3Tool {
  constructor() {
    super('GetBucketPolicy', 'Returns the access policy of a specified bucket, detailing permissions and access rules.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket policy: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the policy status for a bucket.
 */
export class GetBucketPolicyStatus extends S3Tool {
  constructor() {
    super('GetBucketPolicyStatus', 'Retrieves the policy status for a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketPolicyStatusCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket policy status: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the replication configuration of a bucket.
 */
export class GetBucketReplication extends S3Tool {
  constructor() {
    super('GetBucketReplication', 'Returns the replication configuration of a bucket, detailing cross-region replication settings.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketReplicationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket replication: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the request payment configuration of a bucket.
 */
export class GetBucketRequestPayment extends S3Tool {
  constructor() {
    super('GetBucketRequestPayment', 'Returns the request payment configuration of a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketRequestPaymentCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket request payment config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the tag set associated with the specified bucket.
 */
export class GetBucketTagging extends S3Tool {
  constructor() {
    super('GetBucketTagging', 'Returns the tag set associated with the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket tags: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns the versioning state of a bucket.
 */
export class GetBucketVersioning extends S3Tool {
  constructor() {
    super('GetBucketVersioning', 'Returns the versioning state of a bucket, indicating if versioning is enabled or suspended.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket versioning: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the website configuration for a bucket.
 */
export class GetBucketWebsite extends S3Tool {
  constructor() {
    super('GetBucketWebsite', 'Retrieves the website configuration for a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetBucketWebsiteCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket website config: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Retrieves the Public Access Block configuration for a specified bucket.
 */
export class GetPublicAccessBlock extends S3Tool {
  constructor() {
    super('GetPublicAccessBlock', 'Retrieves the Public Access Block configuration for a specified bucket, which controls public access settings.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName } = args;
      
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
        // Return default configuration when none exists
        return {
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            BlockPublicPolicy: false,
            IgnorePublicAcls: false,
            RestrictPublicBuckets: false
          }
        };
      }
      logger.error(`Error getting public access block: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Lists the analytics configurations for the specified bucket.
 */
export class ListBucketAnalyticsConfigurations extends S3Tool {
  constructor() {
    super('ListBucketAnalyticsConfigurations', 'Lists the analytics configurations for the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, continuationToken } = args;
      
      const command = new ListBucketAnalyticsConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket analytics configurations: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Lists the S3 Intelligent-Tiering configurations from the specified bucket.
 */
export class ListBucketIntelligentTieringConfigurations extends S3Tool {
  constructor() {
    super('ListBucketIntelligentTieringConfigurations', 'Lists the S3 Intelligent-Tiering configurations from the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, continuationToken } = args;
      
      const command = new ListBucketIntelligentTieringConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket Intelligent-Tiering configurations: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns a list of inventory configurations for the specified bucket.
 */
export class ListBucketInventoryConfigurations extends S3Tool {
  constructor() {
    super('ListBucketInventoryConfigurations', 'Lists the inventory configurations for the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, continuationToken } = args;
      
      const command = new ListBucketInventoryConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket inventory configurations: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Lists the metrics configurations for the specified bucket.
 */
export class ListBucketMetricsConfigurations extends S3Tool {
  constructor() {
    super('ListBucketMetricsConfigurations', 'Lists the metrics configurations for the specified bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, continuationToken } = args;
      
      const command = new ListBucketMetricsConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket metrics configurations: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns metadata about all versions of the objects in a bucket.
 */
export class ListObjectVersions extends S3Tool {
  constructor() {
    super('ListObjectVersions', 'Returns metadata about all versions of the objects in a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        prefix: {
          type: 'string',
          description: 'Limits the response to keys that begin with the specified prefix (optional).'
        },
        keyMarker: {
          type: 'string',
          description: 'Specifies the key to start with when listing object versions (optional).'
        },
        maxKeys: {
          type: 'number',
          description: 'Sets the maximum number of keys returned in the response (optional).'
        },
        versionIdMarker: {
          type: 'string',
          description: 'Specifies the object version you want to start listing from (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { bucketName, prefix, keyMarker, maxKeys, versionIdMarker } = args;
      
      const command = new ListObjectVersionsCommand({
        Bucket: bucketName,
        Prefix: prefix,
        KeyMarker: keyMarker,
        MaxKeys: maxKeys,
        VersionIdMarker: versionIdMarker
      });
      const response = await this.executeWithCommand({ command, region: undefined });
      
      return response;

    } catch (error) {
      logger.error(`Error listing object versions: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns some or all of the objects in a bucket.
 */
export class ListObjects extends S3Tool {
  constructor() {
    super('ListObjects', 'Returns some or all of the objects in a bucket.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        delimiter: {
          type: 'string',
          description: 'A delimiter is a character you use to group keys (optional).'
        },
        prefix: {
          type: 'string',
          description: 'Limits the response to keys that begin with the specified prefix (optional).'
        },
        marker: {
          type: 'string',
          description: 'Specifies the key to start with when listing objects in a bucket (optional).'
        },
        maxKeys: {
          type: 'number',
          description: 'Sets the maximum number of keys returned in the response (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, delimiter, prefix, marker, maxKeys } = args;
      
      const command = new ListObjectsCommand({
        Bucket: bucketName,
        Delimiter: delimiter,
        Prefix: prefix,
        Marker: marker,
        MaxKeys: maxKeys
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing objects: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Returns some or all of the objects in a bucket using version 2 of the API.
 */
export class ListObjectsV2 extends S3Tool {
  constructor() {
    super('ListObjectsV2', 'Returns some or all of the objects in a bucket using version 2 of the API, supporting pagination and additional filtering.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        delimiter: {
          type: 'string',
          description: 'A delimiter is a character you use to group keys (optional).'
        },
        prefix: {
          type: 'string',
          description: 'Limits the response to keys that begin with the specified prefix (optional).'
        },
        continuationToken: {
          type: 'string',
          description: 'Token indicating where to continue listing objects (optional).'
        },
        maxKeys: {
          type: 'number',
          description: 'Sets the maximum number of keys returned in the response (optional).'
        },
        fetchOwner: {
          type: 'boolean',
          description: 'Indicates whether to include the owner field in the response (optional).',
          default: false
        },
        startAfter: {
          type: 'string',
          description: 'Specifies the key to start with when listing objects in a bucket (optional).'
        }
      },
      required: ['bucketName', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, delimiter, prefix, continuationToken, maxKeys, fetchOwner, startAfter } = args;
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: delimiter,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: maxKeys,
        FetchOwner: fetchOwner,
        StartAfter: startAfter
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing objects: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Lists the parts that have been uploaded for a specific multipart upload.
 */
export class ListParts extends S3Tool {
  constructor() {
    super('ListParts', 'Lists the parts that have been uploaded for a specific multipart upload.', {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        key: {
          type: 'string',
          description: 'Object key for which the multipart upload was initiated.'
        },
        uploadId: {
          type: 'string',
          description: 'Upload ID identifying the multipart upload whose parts are being listed.'
        },
        partNumberMarker: {
          type: 'number',
          description: 'Sets the part number after which listing begins (optional).'
        },
        maxParts: {
          type: 'number',
          description: 'Sets the maximum number of parts to return in the response (optional).'
        }
      },
      required: ['bucketName', 'key', 'uploadId', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { region, bucketName, key, uploadId, partNumberMarker, maxParts } = args;
      
      const command = new ListPartsCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
        MaxParts: maxParts
      });
      const response = await this.executeWithCommand({ command, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing parts: ${error.message}`);
      throw error;
    }
  }
}

// Export all tools as named exports for consistency
export const s3Tools = {
  GetBucketAcl,
  GetBucketEncryption,
  GetBucketLocation,
  GetBucketLogging,
  GetBucketPolicy,
  GetBucketReplication,
  GetBucketTagging,
  GetBucketVersioning,
  GetPublicAccessBlock,
  ListBuckets,
  ListObjectsV2,
}; 