import Tool from '../../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../../logger.js';

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

import { accountCredentials, defaultRegion } from '../config/awsConfig.js';

const getS3Client = (account, region) => {
  const validAccounts = Object.keys(accountCredentials);
  if (!validAccounts.includes(account)) {
    throw new Error(`Invalid account. Must be one of: ${validAccounts.join(', ')}`);
  }

  const credentials = accountCredentials[account];
  if (!credentials) {
    throw new Error(`No credentials found for account: ${account}`);
  }

  return new S3Client({
    region: region || defaultRegion,
    credentials,
    maxAttempts: 3,
    requestTimeout: 5000
  });
};

class S3Tool extends Tool {
  constructor(name, description, parameters) {
    super(name, description, parameters);
  }

  async executeWithCommand({ command, account, region }) {
    const s3Client = getS3Client(account, region);
    try {
      const response = await s3Client.send(command);
      return response;
    } catch (error) {
      logger.error(`Error executing S3 command: ${error.message}`);
      throw error;
    }
  }
}

const account = { type: 'string', description: 'The AWS account to use. One of "caredove-dev" or "caredove-prod".', default: 'caredove-dev' };
const region = { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' };

/**
 * Retrieves the Transfer Acceleration state of a specified S3 bucket.
 */
export class GetBucketAccelerateConfiguration extends S3Tool {
  constructor() {
    super('GetBucketAccelerateConfiguration', 'Retrieves the Transfer Acceleration state of a specified Amazon S3 bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket acceleration configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket acceleration config: ${error.message}`);
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
 * Returns a list of all buckets owned by the authenticated sender of the request.
 */
export class ListBuckets extends S3Tool {
  constructor() {
    super('ListBuckets', 'Returns a list of all buckets owned by the authenticated sender of the request.', {
      type: 'object',
      properties: {
        account,
        region,
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
        data: `Listing buckets in ${account}/${region}...`
      });

      const command = new ListBucketsCommand({});
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing buckets: ${error.message}`);
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
 * Returns the Access Control List (ACL) of a specified S3 bucket.
 */
export class GetBucketAcl extends S3Tool {
  constructor() {
    super('GetBucketAcl', 'Returns the Access Control List (ACL) of a specified S3 bucket, detailing the permissions granted on the bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket ACL for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketAclCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket ACL: ${error.message}`);
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
 * Retrieves an analytics configuration from the specified bucket.
 */
export class GetBucketAnalyticsConfiguration extends S3Tool {
  constructor() {
    super('GetBucketAnalyticsConfiguration', 'Retrieves an analytics configuration from the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID that identifies the analytics configuration.'
        }
      },
      required: ['bucketName', 'id', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, id: configId } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket analytics configuration ${configId} for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketAnalyticsConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket analytics config: ${error.message}`);
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
 * Returns the Cross-Origin Resource Sharing (CORS) configuration of a bucket.
 */
export class GetBucketCors extends S3Tool {
  constructor() {
    super('GetBucketCors', 'Returns the CORS configuration of a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket CORS configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketCorsCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket CORS config: ${error.message}`);
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
 * Retrieves the default encryption configuration for a specified S3 bucket.
 */
export class GetBucketEncryption extends S3Tool {
  constructor() {
    super('GetBucketEncryption', 'Retrieves the default encryption configuration for a specified S3 bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket encryption configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket encryption: ${error.message}`);
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
 * Retrieves the S3 Intelligent-Tiering configuration from the specified bucket.
 */
export class GetBucketIntelligentTieringConfiguration extends S3Tool {
  constructor() {
    super('GetBucketIntelligentTieringConfiguration', 'Retrieves the S3 Intelligent-Tiering configuration from the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID used to identify the Intelligent-Tiering configuration.'
        }
      },
      required: ['bucketName', 'id', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, id: configId } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting Intelligent-Tiering configuration ${configId} for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketIntelligentTieringConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket Intelligent-Tiering config: ${error.message}`);
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
 * Returns an inventory configuration from the specified bucket.
 */
export class GetBucketInventoryConfiguration extends S3Tool {
  constructor() {
    super('GetBucketInventoryConfiguration', 'Returns an inventory configuration from the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID that identifies the inventory configuration.'
        }
      },
      required: ['bucketName', 'id', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, id: configId } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting inventory configuration ${configId} for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketInventoryConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket inventory config: ${error.message}`);
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
 * Returns the lifecycle configuration of a bucket.
 */
export class GetBucketLifecycleConfiguration extends S3Tool {
  constructor() {
    super('GetBucketLifecycleConfiguration', 'Returns the lifecycle configuration of a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting lifecycle configuration for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket lifecycle config: ${error.message}`);
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
 * Returns the AWS Region where the specified bucket resides.
 */
export class GetBucketLocation extends S3Tool {
  constructor() {
    super('GetBucketLocation', 'Returns the AWS Region where the specified bucket resides.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket location for ${bucketName} in ${account}...`
      });

      const command = new GetBucketLocationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region: undefined });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket location: ${error.message}`);
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
 * Returns the logging status of a bucket.
 */
export class GetBucketLogging extends S3Tool {
  constructor() {
    super('GetBucketLogging', 'Returns the logging status of a bucket and the permissions users have to view and modify that status.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket logging configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketLoggingCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket logging: ${error.message}`);
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
 * Returns a metrics configuration from the specified bucket.
 */
export class GetBucketMetricsConfiguration extends S3Tool {
  constructor() {
    super('GetBucketMetricsConfiguration', 'Returns a metrics configuration from the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        id: {
          type: 'string',
          description: 'The ID used to identify the metrics configuration.'
        }
      },
      required: ['bucketName', 'id', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, id: configId } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting metrics configuration ${configId} for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketMetricsConfigurationCommand({ Bucket: bucketName, Id: configId });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket metrics config: ${error.message}`);
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
 * Returns the notification configuration of a bucket.
 */
export class GetBucketNotificationConfiguration extends S3Tool {
  constructor() {
    super('GetBucketNotificationConfiguration', 'Returns the notification configuration of a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting notification configuration for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketNotificationConfigurationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket notification config: ${error.message}`);
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
 * Retrieves OwnershipControls for an S3 bucket.
 */
export class GetBucketOwnershipControls extends S3Tool {
  constructor() {
    super('GetBucketOwnershipControls', 'Retrieves OwnershipControls for an S3 bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting ownership controls for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketOwnershipControlsCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket ownership controls: ${error.message}`);
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
 * Returns the access policy of a specified bucket.
 */
export class GetBucketPolicy extends S3Tool {
  constructor() {
    super('GetBucketPolicy', 'Returns the access policy of a specified bucket, detailing permissions and access rules.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket policy for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketPolicyCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket policy: ${error.message}`);
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
 * Retrieves the policy status for a bucket.
 */
export class GetBucketPolicyStatus extends S3Tool {
  constructor() {
    super('GetBucketPolicyStatus', 'Retrieves the policy status for a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting policy status for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketPolicyStatusCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket policy status: ${error.message}`);
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
 * Returns the replication configuration of a bucket.
 */
export class GetBucketReplication extends S3Tool {
  constructor() {
    super('GetBucketReplication', 'Returns the replication configuration of a bucket, detailing cross-region replication settings.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket replication configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketReplicationCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket replication: ${error.message}`);
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
 * Returns the request payment configuration of a bucket.
 */
export class GetBucketRequestPayment extends S3Tool {
  constructor() {
    super('GetBucketRequestPayment', 'Returns the request payment configuration of a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting request payment configuration for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketRequestPaymentCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket request payment config: ${error.message}`);
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
 * Returns the tag set associated with the specified bucket.
 */
export class GetBucketTagging extends S3Tool {
  constructor() {
    super('GetBucketTagging', 'Returns the tag set associated with the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket tags for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket tags: ${error.message}`);
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
 * Returns the versioning state of a bucket.
 */
export class GetBucketVersioning extends S3Tool {
  constructor() {
    super('GetBucketVersioning', 'Returns the versioning state of a bucket, indicating if versioning is enabled or suspended.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting bucket versioning configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket versioning: ${error.message}`);
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
 * Retrieves the website configuration for a bucket.
 */
export class GetBucketWebsite extends S3Tool {
  constructor() {
    super('GetBucketWebsite', 'Retrieves the website configuration for a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting website configuration for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new GetBucketWebsiteCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error getting bucket website config: ${error.message}`);
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
 * Retrieves the Public Access Block configuration for a specified bucket.
 */
export class GetPublicAccessBlock extends S3Tool {
  constructor() {
    super('GetPublicAccessBlock', 'Retrieves the Public Access Block configuration for a specified bucket, which controls public access settings.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Getting public access block configuration for ${bucketName} in ${account}/${region}...`
      });

      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await this.executeWithCommand({ command, account, region });
      
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
 * Lists the analytics configurations for the specified bucket.
 */
export class ListBucketAnalyticsConfigurations extends S3Tool {
  constructor() {
    super('ListBucketAnalyticsConfigurations', 'Lists the analytics configurations for the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, continuationToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing analytics configurations for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListBucketAnalyticsConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket analytics configurations: ${error.message}`);
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
 * Lists the S3 Intelligent-Tiering configurations from the specified bucket.
 */
export class ListBucketIntelligentTieringConfigurations extends S3Tool {
  constructor() {
    super('ListBucketIntelligentTieringConfigurations', 'Lists the S3 Intelligent-Tiering configurations from the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, continuationToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing Intelligent-Tiering configurations for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListBucketIntelligentTieringConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket Intelligent-Tiering configurations: ${error.message}`);
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
 * Returns a list of inventory configurations for the specified bucket.
 */
export class ListBucketInventoryConfigurations extends S3Tool {
  constructor() {
    super('ListBucketInventoryConfigurations', 'Lists the inventory configurations for the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, continuationToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing inventory configurations for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListBucketInventoryConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket inventory configurations: ${error.message}`);
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
 * Lists the metrics configurations for the specified bucket.
 */
export class ListBucketMetricsConfigurations extends S3Tool {
  constructor() {
    super('ListBucketMetricsConfigurations', 'Lists the metrics configurations for the specified bucket.', {
      type: 'object',
      properties: {
        account,
        region,
        bucketName: {
          type: 'string',
          description: 'The name of the S3 bucket.'
        },
        continuationToken: {
          type: 'string',
          description: 'Token for the next page of results (optional).'
        }
      },
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, continuationToken } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing metrics configurations for bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListBucketMetricsConfigurationsCommand({ 
        Bucket: bucketName, 
        ContinuationToken: continuationToken 
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing bucket metrics configurations: ${error.message}`);
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
 * Returns metadata about all versions of the objects in a bucket.
 */
export class ListObjectVersions extends S3Tool {
  constructor() {
    super('ListObjectVersions', 'Returns metadata about all versions of the objects in a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
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
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, bucketName, prefix, keyMarker, maxKeys, versionIdMarker } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing object versions for bucket ${bucketName} in ${account}...`
      });

      const command = new ListObjectVersionsCommand({
        Bucket: bucketName,
        Prefix: prefix,
        KeyMarker: keyMarker,
        MaxKeys: maxKeys,
        VersionIdMarker: versionIdMarker
      });
      const response = await this.executeWithCommand({ command, account, region: undefined });
      
      return response;

    } catch (error) {
      logger.error(`Error listing object versions: ${error.message}`);
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
 * Returns some or all of the objects in a bucket.
 */
export class ListObjects extends S3Tool {
  constructor() {
    super('ListObjects', 'Returns some or all of the objects in a bucket.', {
      type: 'object',
      properties: {
        account,
        region,
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
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, delimiter, prefix, marker, maxKeys } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing objects in bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListObjectsCommand({
        Bucket: bucketName,
        Delimiter: delimiter,
        Prefix: prefix,
        Marker: marker,
        MaxKeys: maxKeys
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing objects: ${error.message}`);
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
 * Returns some or all of the objects in a bucket using version 2 of the API.
 */
export class ListObjectsV2 extends S3Tool {
  constructor() {
    super('ListObjectsV2', 'Returns some or all of the objects in a bucket using version 2 of the API, supporting pagination and additional filtering.', {
      type: 'object',
      properties: {
        account,
        region,
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
      required: ['bucketName', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, delimiter, prefix, continuationToken, maxKeys, fetchOwner, startAfter } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing objects in bucket ${bucketName} in ${account}/${region}...`
      });

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: delimiter,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: maxKeys,
        FetchOwner: fetchOwner,
        StartAfter: startAfter
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing objects: ${error.message}`);
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
 * Lists the parts that have been uploaded for a specific multipart upload.
 */
export class ListParts extends S3Tool {
  constructor() {
    super('ListParts', 'Lists the parts that have been uploaded for a specific multipart upload.', {
      type: 'object',
      properties: {
        account,
        region,
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
      required: ['bucketName', 'key', 'uploadId', 'account', 'region']
    });
  }

  async call(id, args, context, streamManager, user) {
    try {
      const { account, region, bucketName, key, uploadId, partNumberMarker, maxParts } = args;
      
      // Emit initial progress
      user.emit('tool.output.chunk', {
        object: 'tool.output.chunk',
        toolCallId: id,
        data: `Listing parts for upload ${uploadId} of ${key} in bucket ${bucketName} (${account}/${region})...`
      });

      const command = new ListPartsCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: partNumberMarker,
        MaxParts: maxParts
      });
      const response = await this.executeWithCommand({ command, account, region });
      
      return response;

    } catch (error) {
      logger.error(`Error listing parts: ${error.message}`);
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