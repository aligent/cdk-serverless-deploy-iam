#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { 
   ManagedPolicy, 
   Role, 
   ServicePrincipal, 
   PolicyStatement, 
   Effect 
} from '@aws-cdk/aws-iam';

const SERVICE_NAME = process.env.SERVICE_NAME
const STACK_SUFFIX = '-iam-bootstrap'

class ServiceIAMBootstrap extends cdk.Stack {

     constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
          super(scope, id, props);

          // Version will be used for auditing which role is being used by projects.
          const version = '1'
          const serviceName = cdk.Stack.of(this).stackName.replace(STACK_SUFFIX,'');
          const accountId = cdk.Stack.of(this).account;
          const region = cdk.Stack.of(this).region

          const s3BucketResources = [`arn:aws:s3:::${serviceName}*`]
          const s3ObjectResources = [`arn:aws:s3:::${serviceName}*/*`]
          const cloudWatchResources = [`arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${serviceName}*`]
          const lambdaResources = [`arn:aws:lambda:${region}:${accountId}:function:${serviceName}*`]
          const stepFunctionResources = [`arn:aws:states:${region}:${accountId}:stateMachine:${serviceName}*`]
          const iamResources = [`arn:aws:iam::${accountId}:role/${serviceName}*`]

          const serviceRole = new Role(this, `ServiceRole-v${version}`, {
               assumedBy: new ServicePrincipal('cloudformation.amazonaws.com')
          });

          // S3 object policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: s3ObjectResources,
                    actions: [            
                         "s3:PutObject",
                         "s3:DeleteObject",
                    ]
               })
          );

          // S3 bucket policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: s3BucketResources,
                    actions: [            
                         "s3:*",
                    ]
               })
          );


          // CloudWatch policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: cloudWatchResources,
                    actions: [            
                         "logs:CreateLogGroup",
                         "logs:DescribeLogGroup",
                         "logs:DeleteLogGroup",
                         "logs:CreateLogStream",
                         "logs:DescribeLogStreams",
                         "logs:DeleteLogStream",
                         "logs:FilterLogEvents"
                    ]
               })
          );


          // Lambda policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: lambdaResources,
                    actions: [            
                         "lambda:GetFunction",
                         "lambda:CreateFunction",
                         "lambda:DeleteFunction",
                         "lambda:UpdateFunctionConfiguration",
                         "lambda:UpdateFunctionCode",
                         "lambda:ListVersionsByFunction",
                         "lambda:PublishVersion",
                         "lambda:CreateAlias",
                         "lambda:DeleteAlias",
                         "lambda:UpdateAlias",
                         "lambda:GetFunctionConfiguration",
                         "lambda:AddPermission",
                         "lambda:RemovePermission",
                         "lambda:InvokeFunction"
                    ]
               })
          );

          // IAM policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: iamResources,
                    actions: [            
                         "iam:PassRole",
                         "iam:CreateRole",
                         "iam:GetRole",
                         "iam:DeleteRole",
                         "iam:GetRolePolicy",
                         "iam:DeleteRolePolicy",
                         "iam:PutRolePolicy",
                    ]
               })
          );

          // DynamoDB policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: stepFunctionResources,
                    actions: [            
                         "dynamodb:CreateTable",
                         "dynamodb:UpdateTable",
                         "dynamodb:DeleteTable",
                    ]
               })
          );

          // StepFunctions policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: stepFunctionResources,
                    actions: [            
                         "states:CreateStateMachine",
                         "states:DeleteStateMachine",
                         "states:TagResource",
                    ]
               })
          );

          new cdk.CfnOutput(this, 'DeployRoleArn', {
               value: serviceRole.roleArn,
               description: 'The ARN of the CloudFormation service role',
               exportName: 'DeployRoleArn',
          });

          new cdk.CfnOutput(this, 'BootstrapVersion', {
               value: version,
               description: 'The version of the bootstrap resources that are currently provisioned in this stack',
               exportName: 'BootstrapVersion',
          });
     }

}

const app = new cdk.App();
new ServiceIAMBootstrap(app, `${SERVICE_NAME}-${STACK_SUFFIX}`, { description: "This stack includes resources needed to deploy Serverless apps into this environment"});
