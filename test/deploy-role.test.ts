import * as cdk from '@aws-cdk/core';
import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, haveResourceLike, countResources, objectLike, arrayWith } from '@aws-cdk/assert';
import { ServiceDeployIAM } from '../bin/app';


test('Creates a deploy role', () => {
     const app = new cdk.App();
     const stack = new ServiceDeployIAM(app, 'jest-deploy-iam');
     expectCDK(stack).to(countResources('AWS::IAM::Role', 1));
     expectCDK(stack).to(haveResource('AWS::IAM::Role', {
     }));
});


test('Creates a deploy user', () => {
     const app = new cdk.App();
     const stack = new ServiceDeployIAM(app, 'jest-deploy-iam');
     expectCDK(stack).to(countResources('AWS::IAM::User', 1));
     expectCDK(stack).to(haveResource('AWS::IAM::User'));
});

test('Deploy policy has correct CloudFormation permissions', () => {
     const app = new cdk.App();
     const stack = new ServiceDeployIAM(app, 'jest-deploy-iam');
     expectCDK(stack).to(haveResourceLike('AWS::IAM::Policy', {
          PolicyDocument: {
               Statement: arrayWith(

                    objectLike({
                         Action: "cloudformation:ValidateTemplate",
                         Effect: "Allow",
                         Resource: "*"
                    }),

                    objectLike({
                         Action: [
                              "cloudformation:CreateStack",
                              "cloudformation:DescribeStacks",
                              "cloudformation:DeleteStack",
                              "cloudformation:DescribeStackEvents",
                              "cloudformation:UpdateStack",
                              "cloudformation:ExecuteChangeSet",
                              "cloudformation:CreateChangeSet",
                              "cloudformation:DeleteChangeSet",
                              "cloudformation:DescribeChangeSet",
                              "cloudformation:ListStackResources",
                              "cloudformation:DescribeStackResource",
                              "cloudformation:DescribeStackResources",
                              "cloudformation:GetTemplate"
                         ],
                         Effect: "Allow",
                         Resource: {
                              "Fn::Join": [
                                   "",
                                   ["arn:aws:cloudformation:",{"Ref": "AWS::Region"},":",{"Ref": "AWS::AccountId"},":stack/jest*"]]
                         }
                    }),
               )
          }
     }));
});