import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  lambdaSG: ec2.SecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbEndpoint: string;
  public readonly dbSecretArn: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const dbSG = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc: props.vpc,
      description: 'Security group for Aurora cluster',
    });
    dbSG.addIngressRule(props.lambdaSG, ec2.Port.tcp(5432), 'Allow Lambda to access Aurora');

    const cluster = new rds.DatabaseCluster(this, 'KaleidoCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSG],
      defaultDatabaseName: 'kaleido_scan',
    });

    this.dbEndpoint = cluster.clusterEndpoint.hostname;
    this.dbSecretArn = cluster.secret!.secretArn;

    new cdk.CfnOutput(this, 'DbEndpoint', { value: this.dbEndpoint });
    new cdk.CfnOutput(this, 'DbSecretArn', { value: this.dbSecretArn });
  }
}
