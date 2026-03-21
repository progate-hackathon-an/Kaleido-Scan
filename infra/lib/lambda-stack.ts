import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  lambdaSG: ec2.SecurityGroup;
  dbEndpoint: string;
  dbSecretArn: string;
}

export class LambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'KaleidoFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('../backend/handler.zip'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(28),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [props.lambdaSG],
      environment: {
        DB_HOST: props.dbEndpoint,
        DB_PORT: '5432',
        DB_USER: 'postgres',
        DB_NAME: 'kaleido_scan',
        DB_SSL_MODE: 'require',
        DB_SECRET_ARN: props.dbSecretArn,
        AI_PROVIDER: 'bedrock',
        BEDROCK_MODEL_ID: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
        FRONTEND_URL: 'https://main.d1n9t8h3zlm71f.amplifyapp.com',
      },
    });

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      resources: [props.dbSecretArn],
    }));

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    }));

    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['aws-marketplace:ViewSubscriptions', 'aws-marketplace:Subscribe', 'aws-marketplace:Unsubscribe'],
      resources: ['*'],
    }));

    const api = new apigwv2.HttpApi(this, 'KaleidoApi', {
      corsPreflight: {
        allowOrigins: ['https://main.d1n9t8h3zlm71f.amplifyapp.com'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
      },
    });

    const integration = new integrations.HttpLambdaIntegration('LambdaIntegration', fn);

    api.addRoutes({ path: '/{proxy+}', methods: [apigwv2.HttpMethod.ANY], integration });
    api.addRoutes({ path: '/', methods: [apigwv2.HttpMethod.ANY], integration });

    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url! });
  }
}
