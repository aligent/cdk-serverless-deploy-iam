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

var EXPORT_PREFIX = process.env.EXPORT_PREFIX
const SERVICE_NAME = process.env.SERVICE_NAME
const SHARED_VPC_ID = process.env.SHARED_VPC_ID
const STACK_SUFFIX = '-deploy-iam'

class ServiceDeployIAM extends cdk.Stack {

     constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
          super(scope, id, props);

          // Version will be used for auditing which role is being used by projects.
          // This should only be updated for BREAKING changes.
          const version = '1'
          const serviceName = cdk.Stack.of(this).stackName.replace(STACK_SUFFIX,'');
          const accountId = cdk.Stack.of(this).account;
          const region = cdk.Stack.of(this).region

          const cloudFormationResources = [`arn:aws:cloudformation:${region}:${accountId}:stack/${serviceName}*`];
          const s3BucketResources = [`arn:aws:s3:::${serviceName}*`, `arn:aws:s3:::${serviceName}*/*`]
          const cloudWatchResources = [`arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/${serviceName}*`]
          const lambdaResources = [`arn:aws:lambda:${region}:${accountId}:function:${serviceName}*`]
          // const stepFunctionResources = [`arn:aws:states:${region}:${accountId}:stateMachine:${serviceName}*`]
          // To cater the requirement that lmbda's naming is being exceeding character limit
          const stepFunctionResources = [`arn:aws:states:${region}:${accountId}:stateMachine:*`]
          const dynamoDbResources = [`arn:aws:dynamodb:${region}:${accountId}:table/${serviceName}*`] 
          const iamResources = [`arn:aws:iam::${accountId}:role/${serviceName}*`]
          const eventBridgeResources = [`arn:aws:events:${region}:${accountId}:rule/${serviceName}*`]
          const apiGatewayResources = [`arn:aws:apigateway:${region}::/*`]
          const ssmDeploymentResources = [`arn:aws:ssm:${region}:${accountId}:*${serviceName}*`]
          const snsResources = [`arn:aws:sns:${region}:${accountId}:${serviceName}*`]
          const serviceRole = new Role(this, `ServiceRole-v${version}`, {
               assumedBy: new ServicePrincipal('cloudformation.amazonaws.com')
          });

          // S3 bucket policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: s3BucketResources,
                    actions: [
                         "s3:*"
                    ]
               })
          );
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                         "s3:ListAllMyBuckets",
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
                              "ec2:CreateNetworkInterface",
                              "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
                              "ec2:DeleteTags",
                              "ec2:DescribeNetworkInterfaces",
                              "ec2:DescribeTags",
                              "ec2:CreateSecurityGroup",
                              "ec2:CreateTags",
                              "ec2:DeleteSecurityGroup",
                              "ec2:DeleteNetworkInterface",
                              "ec2:UpdateSecurityGroupRuleDescriptionsIngress",
                              "ec2:DescribeSecurityGroups",
                              "ec2:DescribeSubnets",
                              "ec2:DescribeVpcs",
                              "ec2:CreateNetworkInterface",
                              "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
                              "ec2:DeleteTags",
                              "dynamodb:*"
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
                         resources: ["arn:aws:iam::*:role/aws-service-role/events.amazonaws.com/AWSServiceRoleForCloudWatchEvents*"],
                         conditions: {
                              "StringLike": {
                                   "iam:AWSServiceName": "events.amazonaws.com"
                               }
                         },
                         actions: [            
                              "iam:CreateServiceLinkedRole"
                         ]
                    })
          );

          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"],
                    actions: [            
                         "autoscaling:Describe*",
                         "cloudwatch:*",
                         "logs:*",
                         "sns:*",
                         "iam:GetPolicy",
                         "iam:GetPolicyVersion",
                         "iam:GetRole"
                    ]
               })
          );
          // Lambda Role Creation
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"],
                    actions: [            
                        "events:*"
                    ]
               })
          );

          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: [`arn:aws:iam::${accountId}:role/horizon*`],
                    actions: [            
                        "iam:*"
                    ]
               })
          );


          // SQS Full Access
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"],
                    actions: [            
                         "sqs:*"
                    ]
               })
          );

          // Lambda policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: lambdaResources,
                    actions: [            
                         "cloudformation:DescribeStacks",
                         "cloudformation:ListStackResources",
                         "cloudwatch:ListMetrics",
                         "cloudwatch:GetMetricData",
                         "ec2:DescribeSecurityGroups",
                         "ec2:DescribeSubnets",
                         "ec2:DescribeVpcs",
                         "kms:ListAliases",
                         "iam:GetPolicy",
                         "iam:GetPolicyVersion",
                         "iam:GetRole",
                         "iam:GetRolePolicy",
                         "iam:ListAttachedRolePolicies",
                         "iam:ListRolePolicies",
                         "iam:ListRoles",
                         "lambda:*",
                         "logs:DescribeLogGroups",
                         "states:DescribeStateMachine",
                         "states:ListStateMachines",
                         "tag:GetResources",
                         "xray:GetTraceSummaries",
                         "ec2:CreateSecurityGroup",
                         "xray:BatchGetTraces",
                         "ec2:CreateNetworkInterface",
                         "ec2:UpdateSecurityGroupRuleDescriptionsEgress",
                         "ec2:DeleteTags",
                         "ec2:DescribeNetworkInterfaces",
                         "ec2:DescribeTags",
                         "ec2:CreateTags",
                         "ec2:DeleteSecurityGroup",
                         "ec2:DeleteNetworkInterface",
                         "ec2:UpdateSecurityGroupRuleDescriptionsIngress"
                    ]
               })
          );
          // Lambda IAM Pass role
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [            
                       "iam:PassRole"
                    ],
                    conditions: {
                         "StringEquals": {
                              "iam:PassedToService": "lambda.amazonaws.com"
                          }
                    },
               })
          );    
          // Lambda Log Streams
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["arn:aws:logs:*:*:log-group:/aws/lambda/*"],
                    actions: [            
                         "logs:DescribeLogStreams",
                         "logs:GetLogEvents",
                         "logs:FilterLogEvents"
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
                         "dynamodb:*"
                    ]
               })
          );
          // DynamoDB policy CloudWatch
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["arn:aws:cloudwatch:*:*:insight-rule/DynamoDBContributorInsights*"],
                    actions: [            
                         "cloudwatch:GetInsightRuleReport"
                    ]
               })
          );
          // DynamoDB IAM Pass Role
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"],
                    actions: [            
                         "iam:PassRole"
                    ],
                    conditions: {
                         "StringLike": {
                              "iam:PassedToService": [
                                  "application-autoscaling.amazonaws.com",
                                  "application-autoscaling.amazonaws.com.cn",
                                  "dax.amazonaws.com"
                              ]
                          } 
                    }
               })
          );
          // DynamoDB IAM Service Linked Role
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ["*"],
                    actions: [            
                         "iam:CreateServiceLinkedRole"
                    ],
                    conditions: {
                         "StringLike": {
                              "iam:AWSServiceName": [
                                   "replication.dynamodb.amazonaws.com",
                                   "dax.amazonaws.com",
                                   "dynamodb.application-autoscaling.amazonaws.com",
                                   "contributorinsights.dynamodb.amazonaws.com",
                                   "kinesisreplication.dynamodb.amazonaws.com"
                              ]
                         }
                    }
               })
          );
          // StepFunctions policy 
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: stepFunctionResources,
                    actions: [            
                         "states:*"
                    ]
               })
          );

          // EventBridge policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: eventBridgeResources,
                    actions: [
                         "events:EnableRule",
                         "events:PutRule",
                         "events:DescribeRule",
                         "events:ListRules",
                         "events:DisableRule",
                         "events:PutTargets",
                         "events:RemoveTargets"
                    ]
               })
          );

          // APIGateway policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: apiGatewayResources,
                    actions: [
                         "apigateway:*",
                    ]
               })
          );


          // SNS policy
          serviceRole.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: snsResources,
                    actions: [
                         "sns:GetTopicAttributes",
                         "sns:CreateTopic",
                         "sns:DeleteTopic",
                         "sns:Subscribe",
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
                         "cloudformation:*",
                     
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
                         "cloudformation:DescribeStackResource",
                        
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
          
          // S3 bucket policy
          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: s3BucketResources,
                    actions: [
                         "s3:ListBucket",
                         "s3:DeleteObject",
                         "s3:PutObject",
                         "s3:GetObject",
                         "s3:GetBucketLocation",
                         "s3:CreateBucket",
                         "s3:GetEncryptionConfiguration",
                         "s3:PutEncryptionConfiguration",
                         "s3:PutBucketPolicy"
                    ]
               })
          );
          //  See https://github.com/serverless/serverless/issues/5919
          deployGroup.addToPolicy(
               new PolicyStatement({
                    effect: Effect.ALLOW,
                    resources: ['*'],
                    actions: [
                         "apigateway:GET",
                         "s3:ListAllMyBuckets",
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

          // Export CDK Output
          if (!EXPORT_PREFIX){
               EXPORT_PREFIX=serviceName;
          }
          if(!EXPORT_PREFIX.endsWith('-')){
               EXPORT_PREFIX=EXPORT_PREFIX.concat("-");
          }
        
          new cdk.CfnOutput(this, `${EXPORT_PREFIX}DeployUserName`, {
               description: "PublisherUser",
               exportName: `${EXPORT_PREFIX}serverless-deployer-username`,
               value: deployUser.userName,
          });

          new cdk.CfnOutput(this, `${EXPORT_PREFIX}DeployRoleArn`, {
               value: serviceRole.roleArn,
               exportName: `${EXPORT_PREFIX}serverless-deployer-role-arn`,
               description: "The ARN of the CloudFormation service role",
          });

          new cdk.CfnOutput(this, `${EXPORT_PREFIX}Version`, {
               value: version,
               exportName: `${EXPORT_PREFIX}cdk-stack-version`,
               description: `The version of the resources that are currently provisioned in this stack`,
          });

          const parameterName = `/serverless-deploy-iam/${serviceName}/version`;

          new ssm.StringParameter(this, 'ServerlessDeployIAMVersion', {
               parameterName: parameterName,
               description: 'The version of the serverless-deploy-iam resources',
               stringValue: version
          });
     }

}

const app = new cdk.App();
new ServiceDeployIAM(app, `${SERVICE_NAME}${STACK_SUFFIX}`, { description: "This stack includes IAM resources needed to deploy Serverless apps into this environment"});
