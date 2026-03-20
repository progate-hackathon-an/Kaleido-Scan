#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { GithubOidcStack } from '../lib/github-oidc-stack';

const app = new cdk.App();

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' };

const networkStack = new NetworkStack(app, 'KaleidoNetworkStack', { env });

const databaseStack = new DatabaseStack(app, 'KaleidoDatabaseStack', {
  env,
  vpc: networkStack.vpc,
  lambdaSG: networkStack.lambdaSG,
});
databaseStack.addDependency(networkStack);

const lambdaStack = new LambdaStack(app, 'KaleidoLambdaStack', {
  env,
  vpc: networkStack.vpc,
  lambdaSG: networkStack.lambdaSG,
  dbEndpoint: databaseStack.dbEndpoint,
  dbSecretArn: databaseStack.dbSecretArn,
});
lambdaStack.addDependency(databaseStack);

new GithubOidcStack(app, 'KaleidoGithubOidc', { env });
