import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    IAMClient,
    GetAccessKeyLastUsedCommand,
    GetAccountAuthorizationDetailsCommand,
    GetServiceLastAccessedDetailsCommand,
    SimulatePrincipalPolicyCommand,
    ListUsersCommand,
    ListRolesCommand,
    ListGroupsCommand,
    ListAttachedRolePoliciesCommand,
    ListAttachedUserPoliciesCommand,
    ListEntitiesForPolicyCommand,
    GetPolicyCommand,
    GetPolicyVersionCommand,
    GetUserCommand,
} from "@aws-sdk/client-iam";

class IamTool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const iamClient = this.getIamClient(region);
        try {
            const response = await iamClient.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing IAM command: ${error.message}`);
            throw error;
        }
    }

    getIamClient(region) {
        return new IAMClient({
            region: region || process.env.AWS_DEFAULT_REGION,
            maxAttempts: 3,
            requestTimeout: 5000
        });
    }
}

export class GetAccessKeyLastUsed extends IamTool {
    constructor() {
        super('GetAccessKeyLastUsed', 'Monitors when access keys were last used, aiding in identifying stale credentials.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                accessKeyId: {
                    type: 'string',
                    description: 'The ID of the access key to check.'
                }
            },
            required: ['accessKeyId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, accessKeyId } = args;
            
            const command = new GetAccessKeyLastUsedCommand({ AccessKeyId: accessKeyId });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting access key last used: ${error.message}`);
            throw error;
        }
    }
}

export class GetAccountAuthorizationDetails extends IamTool {
    constructor() {
        super('GetAccountAuthorizationDetails', 'Gets a detailed snapshot of IAM entities and their relationships.', {
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
            
            const command = new GetAccountAuthorizationDetailsCommand();
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting account authorization details: ${error.message}`);
            throw error;
        }
    }
}

export class GetServiceLastAccessedDetails extends IamTool {
    constructor() {
        super('GetServiceLastAccessedDetails', 'Audits when IAM entities last accessed specific AWS services.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                arn: {
                    type: 'string',
                    description: 'The ARN of the IAM entity (user, group, or role).'
                }
            },
            required: ['arn', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, arn } = args;
            
            const command = new GetServiceLastAccessedDetailsCommand({ Arn: arn });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting service last accessed details: ${error.message}`);
            throw error;
        }
    }
}

export class SimulatePrincipalPolicy extends IamTool {
    constructor() {
        super('SimulatePrincipalPolicy', 'Tests IAM policies for a user, group, or role against specific actions/resources.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                policySourceArn: {
                    type: 'string',
                    description: 'The ARN of the IAM entity to simulate.'
                },
                actionNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of actions to simulate.'
                },
                resourceArns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of resource ARNs to simulate against.'
                }
            },
            required: ['policySourceArn', 'actionNames', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, policySourceArn, actionNames, resourceArns } = args;
            
            const command = new SimulatePrincipalPolicyCommand({
                PolicySourceArn: policySourceArn,
                ActionNames: actionNames,
                ResourceArns: resourceArns
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error simulating principal policy: ${error.message}`);
            throw error;
        }
    }
}

export class ListUsers extends IamTool {
    constructor() {
        super('ListUsers', 'Lists all IAM users, ensuring there are no unauthorized or legacy accounts.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                maxItems: {
                    type: 'number',
                    description: 'The maximum number of users to return (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, maxItems } = args;
            
            const command = new ListUsersCommand({ MaxItems: maxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing users: ${error.message}`);
            throw error;
        }
    }
}

export class ListRoles extends IamTool {
    constructor() {
        super('ListRoles', 'Enumerates all roles and validates their necessity or configurations.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                maxItems: {
                    type: 'number',
                    description: 'The maximum number of roles to return (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, maxItems } = args;
            
            const command = new ListRolesCommand({ MaxItems: maxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing roles: ${error.message}`);
            throw error;
        }
    }
}

export class ListGroups extends IamTool {
    constructor() {
        super('ListGroups', 'Reviews IAM groups for unnecessary or misconfigured groupings.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                maxItems: {
                    type: 'number',
                    description: 'The maximum number of groups to return (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, maxItems } = args;
            
            const command = new ListGroupsCommand({ MaxItems: maxItems });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing groups: ${error.message}`);
            throw error;
        }
    }
}

export class ListAttachedRolePolicies extends IamTool {
    constructor() {
        super('ListAttachedRolePolicies', 'Views policies directly attached to a role.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                roleName: {
                    type: 'string',
                    description: 'The name of the role to list attached policies for.'
                }
            },
            required: ['roleName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, roleName } = args;
            
            const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing attached role policies: ${error.message}`);
            throw error;
        }
    }
}

export class ListAttachedUserPolicies extends IamTool {
    constructor() {
        super('ListAttachedUserPolicies', 'Identifies managed policies attached to IAM users for cleanup or review.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                userName: {
                    type: 'string',
                    description: 'The name of the user to list attached policies for.'
                }
            },
            required: ['userName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, userName } = args;
            
            const command = new ListAttachedUserPoliciesCommand({ UserName: userName });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing attached user policies: ${error.message}`);
            throw error;
        }
    }
}

export class ListEntitiesForPolicy extends IamTool {
    constructor() {
        super('ListEntitiesForPolicy', 'Determines which IAM users, groups, or roles have a particular policy attached.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                policyArn: {
                    type: 'string',
                    description: 'The ARN of the policy to list entities for.'
                }
            },
            required: ['policyArn', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, policyArn } = args;
            
            const command = new ListEntitiesForPolicyCommand({ PolicyArn: policyArn });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error listing entities for policy: ${error.message}`);
            throw error;
        }
    }
}

export class GetPolicy extends IamTool {
    constructor() {
        super('GetPolicy', 'Retrieves details about a managed policy, including its usage.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                policyArn: {
                    type: 'string',
                    description: 'The ARN of the policy to retrieve.'
                }
            },
            required: ['policyArn', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, policyArn } = args;
            
            const command = new GetPolicyCommand({ PolicyArn: policyArn });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting policy: ${error.message}`);
            throw error;
        }
    }
}

export class GetPolicyVersion extends IamTool {
    constructor() {
        super('GetPolicyVersion', 'Fetches specific versions of a managed policy, useful for audits and compliance checks.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                policyArn: {
                    type: 'string',
                    description: 'The ARN of the policy to retrieve the version for.'
                },
                versionId: {
                    type: 'string',
                    description: 'The ID of the policy version to retrieve.'
                }
            },
            required: ['policyArn', 'versionId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, policyArn, versionId } = args;
            
            const command = new GetPolicyVersionCommand({ PolicyArn: policyArn, VersionId: versionId });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting policy version: ${error.message}`);
            throw error;
        }
    }
}

export class GetUser extends IamTool {
    constructor() {
        super('GetUser', 'Obtains detailed information about a specific IAM user, including their permissions.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                userName: {
                    type: 'string',
                    description: 'The name of the user to retrieve information for.'
                }
            },
            required: ['userName', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, userName } = args;
            
            const command = new GetUserCommand({ UserName: userName });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting user: ${error.message}`);
            throw error;
        }
    }
}

export const iamTools = {
    GetAccessKeyLastUsed,
    GetAccountAuthorizationDetails,
    GetServiceLastAccessedDetails,
    SimulatePrincipalPolicy,
    ListUsers,
    ListRoles,
    ListGroups,
    ListAttachedRolePolicies,
    ListAttachedUserPolicies,
    ListEntitiesForPolicy,
    GetPolicy,
    GetPolicyVersion,
    GetUser,
}; 