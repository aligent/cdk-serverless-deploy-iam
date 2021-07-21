#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { 
   ManagedPolicy, 
   Role, 
   ServicePrincipal, 
   PolicyStatement, 
   Effect 
} from '@aws-cdk/aws-iam';

class MicroserviceDeployRole extends cdk.Stack {

     constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
          super(scope, id, props);
          const version = '0.0.1'
          const serviceName = 'polygon-akeneo-product'
          const region = 'ap-southeast-2'
          const accountId = '00000000'
          const stage = ''

          const s3BucketResources = [`arn:aws:s3:${region}:${accountId}:${serviceName}*`]
          const s3ObjectResources = [`arn:aws:s3:${region}:${accountId}:${serviceName}*/*`]
          const cloudFormationResources = [`arn:aws:cloudformation:${region}:${accountId}:stack/${serviceName}-${stage}*`]
          const cloudWatchResources = [`arn:aws:logs:${region}:${accountId}:log-group:${serviceName}*/*`]
          const lambdaResources = [`arn:aws:lambda:${region}:${accountId}:function:${serviceName}*`]
          const stepFunctionResources = [`arn:aws:states:${region}:${accountId}:stateMachine:${serviceName}*`]

          const serviceRole = new Role(this, `MicroserviceDeployServiceRole-V${version}`, {
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
                         "s3:DeleteBucket",
                         "s3:CreateBucket",
                    ]
               })
          );

          // CloudFormation policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: cloudFormationResources,
                    actions: [            
                         "cloudformation:CreateStack",
                         "cloudformation:UpdateStack",
                         "cloudformation:ValidateTemplate",
                         "cloudformation:DeleteStack",
                         "cloudformation:DescribeStackEvents",
                         "cloudformation:DescribeStacks",
                         "cloudformation:GetStackPolicy",
                         "cloudformation:ListStackResources",
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
                         "logs:DeleteLogGroup",
                    ]
               })
          );

          // Lambda policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: lambdaResources,
                    actions: [            
                         "lambda:CreateFunction",
                         "lambda:DeleteFunction",
                         "lambda:RemovePermission",
                         "lambda:AddPermission",
                         "lambda:GetFunction",
                         "lambda:GetFunctionCodeSigningConfig",
                         "lambda:ListVersionsByFunction",
                         "lambda:PublishVersion",
                    ]
               })
          );

          // DynamoDB policy

          // StepFunctions policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: stepFunctionResources,
                    actions: [            
                         "states:CreateStateMachine",
                         "states:DeleteStateMachine",
                    ]
               })
          );

     }
}


const app = new cdk.App();

new MicroserviceDeployRole(app, 'cloudformation-deploy-role-stack', {description: "Implements an IAM role for use when deploying services in this account"});
