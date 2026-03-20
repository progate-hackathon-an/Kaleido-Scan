import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
interface LambdaStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    lambdaSG: ec2.SecurityGroup;
    dbEndpoint: string;
    dbSecretArn: string;
}
export declare class LambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps);
}
export {};
