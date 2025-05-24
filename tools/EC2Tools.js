import Tool from '../models/Tool.js';
import dotenv from 'dotenv';
import logger from '../logger.js';

dotenv.config();

import {
    EC2Client,
    DescribeSecurityGroupsCommand,
    DescribeSubnetsCommand,
    DescribeInstancesCommand,
    DescribeVolumesCommand,
    DescribeSnapshotsCommand,
    DescribeVpcsCommand,
    DescribeNetworkInterfacesCommand,
    DescribeInternetGatewaysCommand,
    DescribeNatGatewaysCommand,
    DescribeRouteTablesCommand,
    DescribeVpcPeeringConnectionsCommand,
    DescribeInstanceStatusCommand,
    GetConsoleOutputCommand,
    DescribeImageAttributeCommand,
    DescribeLaunchTemplatesCommand,
    DescribeAddressesCommand,
} from "@aws-sdk/client-ec2";

const getEc2Client = (region) => {
    return new EC2Client({
        region: region || process.env.AWS_DEFAULT_REGION,
        maxAttempts: 3,
        requestTimeout: 5000
    });
};

class EC2Tool extends Tool {
    constructor(name, description, parameters) {
        super(name, description, parameters);
    }

    async executeWithCommand({ command, region }) {
        const ec2Client = getEc2Client(region);
        try {
            const response = await ec2Client.send(command);
            return response;
        } catch (error) {
            logger.error(`Error executing EC2 command: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeSecurityGroups extends EC2Tool {
    constructor() {
        super('DescribeSecurityGroups', 'Describes EC2 security groups in the specified region', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                groupIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of security group IDs to describe (optional)'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, groupIds } = args;

            const command = new DescribeSecurityGroupsCommand({
                GroupIds: groupIds
            });

            const response = await this.executeWithCommand({ command, region });
            
            return {
                securityGroups: response.SecurityGroups || []
            };

        } catch (error) {
            logger.error(`Error describing security groups: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeSubnets extends EC2Tool {
    constructor() {
        super('DescribeSubnets', 'Describes one or more subnets', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                subnetIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of subnet IDs to describe'
                }
            },
            required: ['subnetIds', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, subnetIds } = args;
            
            const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing subnets: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeInstances extends EC2Tool {
    constructor() {
        super('DescribeInstances', 'Describes EC2 instances in the specified region', {
            type: 'object',
            properties: {
                region: {
                    type: 'string',
                    description: 'The AWS region to query',
                    default: 'ca-central-1'
                },
                instanceIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of instance IDs to describe (optional)'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, instanceIds } = args;

            const command = new DescribeInstancesCommand({
                InstanceIds: instanceIds
            });

            const response = await this.executeWithCommand({ command, region });
            
            return {
                instances: response.Reservations?.flatMap(res => res.Instances) || []
            };

        } catch (error) {
            logger.error(`Error describing EC2 instances: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeVolumes extends EC2Tool {
    constructor() {
        super('DescribeVolumes', 'Provides information about EBS volumes attached to your instances.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                volumeIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of volume IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                    },
                    description: 'Filters to apply for the volumes (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, volumeIds, filters } = args;

            const command = new DescribeVolumesCommand({ 
                VolumeIds: volumeIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing volumes: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeSnapshots extends EC2Tool {
    constructor() {
        super('DescribeSnapshots', 'Retrieves details about EBS snapshots.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                snapshotIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of snapshot IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the snapshots (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, snapshotIds, filters } = args;

            const command = new DescribeSnapshotsCommand({ 
                SnapshotIds: snapshotIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing snapshots: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeVpcs extends EC2Tool {
    constructor() {
        super('DescribeVpcs', 'Retrieves information about your Virtual Private Clouds (VPCs).', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                vpcIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of VPC IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the VPCs (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, vpcIds, filters } = args;

            const command = new DescribeVpcsCommand({ 
                VpcIds: vpcIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing VPCs: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeNetworkInterfaces extends EC2Tool {
    constructor() {
        super('DescribeNetworkInterfaces', 'Retrieves details about one or more network interfaces.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                networkInterfaceIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of network interface IDs (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the network interfaces (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, networkInterfaceIds, filters } = args;

            const command = new DescribeNetworkInterfacesCommand({ 
                NetworkInterfaceIds: networkInterfaceIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing network interfaces: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeInternetGateways extends EC2Tool {
    constructor() {
        super('DescribeInternetGateways', 'Provides information about your internet gateways.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                internetGatewayIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of internet gateway IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the internet gateways (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, internetGatewayIds, filters } = args;

            const command = new DescribeInternetGatewaysCommand({ 
                InternetGatewayIds: internetGatewayIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing internet gateways: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeNatGateways extends EC2Tool {
    constructor() {
        super('DescribeNatGateways', 'Retrieves details about your NAT gateways.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                natGatewayIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of NAT gateway IDs (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the NAT gateways (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, natGatewayIds, filters } = args;

            const command = new DescribeNatGatewaysCommand({ 
                NatGatewayIds: natGatewayIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing NAT gateways: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeRouteTables extends EC2Tool {
    constructor() {
        super('DescribeRouteTables', 'Provides information about one or more route tables within your VPCs.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                routeTableIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of route table IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the route tables (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, routeTableIds, filters } = args;

            const command = new DescribeRouteTablesCommand({ 
                RouteTableIds: routeTableIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing route tables: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeVpcPeeringConnections extends EC2Tool {
    constructor() {
        super('DescribeVpcPeeringConnections', 'Retrieves information about VPC peering connections.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                vpcPeeringConnectionIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of VPC peering connection IDs (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the VPC peering connections (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, vpcPeeringConnectionIds, filters } = args;

            const command = new DescribeVpcPeeringConnectionsCommand({ 
                VpcPeeringConnectionIds: vpcPeeringConnectionIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing VPC peering connections: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeInstanceStatus extends EC2Tool {
    constructor() {
        super('DescribeInstanceStatus', 'Retrieves the status of one or more instances.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                instanceIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of instance IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the instances (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, instanceIds, filters } = args;

            const command = new DescribeInstanceStatusCommand({ 
                InstanceIds: instanceIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing instance status: ${error.message}`);
            throw error;
        }
    }
}

export class GetConsoleOutput extends EC2Tool {
    constructor() {
        super('GetConsoleOutput', 'Retrieves the console output for a specified EC2 instance.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                instanceId: {
                    type: 'string',
                    description: 'The ID of the instance.'
                },
                latest: {
                    type: 'boolean',
                    description: 'Whether to retrieve the latest console output (optional).'
                }
            },
            required: ['instanceId', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, instanceId, latest } = args;

            const command = new GetConsoleOutputCommand({ 
                InstanceId: instanceId,
                Latest: latest 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error getting console output: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeImageAttribute extends EC2Tool {
    constructor() {
        super('DescribeImageAttribute', 'Retrieves specific attributes of an Amazon Machine Image (AMI).', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                imageId: {
                    type: 'string',
                    description: 'The ID of the AMI.'
                },
                attribute: {
                    type: 'string',
                    description: 'The attribute of the AMI to describe (e.g., "description").'
                }
            },
            required: ['imageId', 'attribute', 'region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, imageId, attribute } = args;

            const command = new DescribeImageAttributeCommand({ 
                ImageId: imageId,
                Attribute: attribute 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing image attribute: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeLaunchTemplates extends EC2Tool {
    constructor() {
        super('DescribeLaunchTemplates', 'Provides information about one or more EC2 launch templates.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                launchTemplateIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of launch template IDs to describe (optional).'
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string', description: 'Name of the filter.' },
                            values: {
                                type: 'array',
                                items: { type: 'string' },
                                description: 'Array of filter values.'
                            }
                        },
                        required: ['name', 'values']
                    },
                    description: 'Filters to apply for the launch templates (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, launchTemplateIds, filters } = args;

            const command = new DescribeLaunchTemplatesCommand({ 
                LaunchTemplateIds: launchTemplateIds,
                Filters: filters 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing launch templates: ${error.message}`);
            throw error;
        }
    }
}

export class DescribeAddresses extends EC2Tool {
    constructor() {
        super('DescribeAddresses', 'Lists and provides details about your Elastic IP addresses.', {
            type: 'object',
            properties: {
                region: { type: 'string', description: 'The AWS region to use. This is probably ca-central-1 (default), unless otherwise specified.', default: 'ca-central-1' },
                publicIps: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of public IPs to describe (optional).'
                },
                allocationIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of allocation IDs (optional).'
                }
            },
            required: ['region']
        });
    }

    async call(id, args, context, streamManager, user) {
        try {
            const { region, publicIps, allocationIds } = args;

            const command = new DescribeAddressesCommand({ 
                PublicIps: publicIps,
                AllocationIds: allocationIds 
            });
            const response = await this.executeWithCommand({ command, region });
            
            return response;

        } catch (error) {
            logger.error(`Error describing addresses: ${error.message}`);
            throw error;
        }
    }
}

export const ec2Tools = {
    DescribeSecurityGroups,
    DescribeSubnets,
    DescribeInstances,
    DescribeVolumes,
    DescribeSnapshots,
    DescribeVpcs,
    DescribeNetworkInterfaces,
    DescribeInternetGateways,
    DescribeNatGateways,
    DescribeRouteTables,
    DescribeVpcPeeringConnections,
    DescribeInstanceStatus,
    GetConsoleOutput,
    DescribeImageAttribute,
    DescribeLaunchTemplates,
    DescribeAddresses,
};