#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import { 
   ManagedPolicy, 
   Role, 
   ServicePrincipal, 
   PolicyStatement, 
   Effect,
   Group,
   User
} from '@aws-cdk/aws-iam';

const SERVICE_NAME = process.env.SERVICE_NAME
const SHARED_VPC_ID = process.env.SHARED_VPC_ID
const STACK_SUFFIX = '-deploy-bootstrap'

class ServiceDeployBootstrap extends cdk.Stack {

     constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
          super(scope, id, props);

          // Version will be used for auditing which role is being used by projects.
          // This should only be updated for BREAKING changes.
          const version = '1'
          const serviceName = cdk.Stack.of(this).stackName.replace(STACK_SUFFIX,'');
          const accountId = cdk.Stack.of(this).account;
          const region = cdk.Stack.of(this).region

          const cloudFormationResources = [`arn:aws:cloudformation:${region}:${accountId}:stack/${serviceName}*`];
          const s3BucketResources = [`arn:aws:s3:::${serviceName}*`]
          const s3ObjectResources = [`arn:aws:s3:::${serviceName}*/*`]
          const cloudWatchResources = [`arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${serviceName}*`]
          const lambdaResources = [`arn:aws:lambda:${region}:${accountId}:function:${serviceName}*`]
          const stepFunctionResources = [`arn:aws:states:${region}:${accountId}:stateMachine:${serviceName}*`]
          const dynamoDbResources = [`arn:aws:dynamodb:${region}:${accountId}:table/${serviceName}*`] 
          const iamResources = [`arn:aws:iam::${accountId}:role/${serviceName}*`]
          const cloudFormationStackResource = ``
          
          const s3DeploymentResources = [`arn:aws:s3:::${serviceName}*serverlessdeployment*`]
          const ssmDeploymentResources = [`arn:aws:ssm:${region}:${accountId}:parameter/${serviceName}*`]
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


          if (SHARED_VPC_ID) {
               // Secutiry Groups
               serviceRole.addToPolicy(
                    new PolicyStatement({
                         effect: Effect.ALLOW,
                         resources: ['*'],
                         actions: [            
                              "ec2:CreateSecurityGroup",
                              "ec2:DescribeSecurityGroups",
                              "ec2:DescribeSubnets",
                              "ec2:DescribeVpcs",
                              "ec2:createTags"
                         ]
                    })
               );
               serviceRole.addToPolicy(
                    new PolicyStatement({
                         effect: Effect.ALLOW,
                         resources: ['*'],
                         conditions: {
                              "StringEquals": {
                                   "ec2:Vpc": `arn:aws:ec2:${region}:${accountId}vpc:/${SHARED_VPC_ID}`
                              }
                         },
                         actions: [
                              "ec2:DeleteSecurityGroup",
                         ]
                    })
               );
          }


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


          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [            
                         "lambda:GetEventSourceMapping",
                         "lambda:ListEventSourceMappings"
                    ]
               })
          );


          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    conditions: {
                         "StringLike": {
                              "lambda:FunctionArn": lambdaResources[0]
                         }
                    },
                    resources: ['*'],
                    actions: [            
                         "lambda:DeleteEventSourceMapping",
                         "lambda:UpdateEventSourceMapping",
                         "lambda:CreateEventSourceMapping",
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
                         "iam:DetachRolePolicy",
                         "iam:AttachRolePolicy",
                    ]
               })
          );

          // DynamoDB policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: dynamoDbResources,
                    actions: [            
                         "dynamodb:DescribeTable",
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
                         "states:UpdateStateMachine",
                         "states:DeleteStateMachine",
                         "states:DescribeStateMachine",
                         "states:TagResource",
                    ]
               })
          );

          const deployUser = new User(this, 'DeployUser', {
               userName: `${serviceName}-deployer`,
          })

          const deployGroup = new Group(this, `${serviceName}-deployers`);

          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                         "cloudformation:ValidateTemplate",
                    ]
               })
          );

          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: cloudFormationResources,
                    actions: [
                         "cloudformation:CreateStack",
                         "cloudformation:DescribeStacks",
                         "cloudformation:DeleteStack",
                         "cloudformation:DescribeStackEvents",
                         "cloudformation:UpdateStack",
                         "cloudformation:ListStackResources",
                         "cloudformation:DescribeStackResource"
                    ]
               })
          );

          // Serverless uses this to skip functions which have not changed
          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: lambdaResources,
                    actions: [
                         "lambda:GetFunction",
                    ]
               })
          );

          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: [serviceRole.roleArn],
                    actions: [
                         "iam:PassRole"
                    ]
               })
          );
          
          // Deployer user needs to be able to manage the deployment bucket
          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: s3DeploymentResources,
                    actions: [            
                         "s3:*",
                    ]
               })
          );


          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [            
                         "ssm:DescribeParameters",
                    ]
               })
          );

          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ssmDeploymentResources,
                    actions: [            
                         "ssm:GetParameter",
                    ]
               })
          );


          deployUser.addToGroup(deployGroup);

          new cdk.CfnOutput(this, 'DeployUserName', {
               description: 'PublisherUser',
               value: deployUser.userName,
          });

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

          const parameterName = `/serverless-deploy-bootstrap/${serviceName}/version`;

          new ssm.StringParameter(this, 'ServerlessDeployBootstrapVersion', {
               parameterName: parameterName,
               description: 'The version of the serverless-deploy-bootrap resources',
               stringValue: version
          });
     }

}

const app = new cdk.App();
new ServiceDeployBootstrap(app, `${SERVICE_NAME}${STACK_SUFFIX}`, { description: "This stack includes IAM resources needed to deploy Serverless apps into this environment"});
